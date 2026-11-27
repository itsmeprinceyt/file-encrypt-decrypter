const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const PORT = 3000;
const DEBUG_PORT = 9222;
const PASSPHRASE = "correct horse battery staple";

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
    ".woff2": "font/woff2",
};

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function handleRequest(request, response) {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    let filePath = path.join(OUT_DIR, decodeURIComponent(url.pathname));
    if (url.pathname === "/") filePath = path.join(OUT_DIR, "index.html");
    if (!filePath.startsWith(OUT_DIR)) {
        response.writeHead(403).end();
        return;
    }
    fs.readFile(filePath, (error, data) => {
        if (error) {
            fs.readFile(path.join(OUT_DIR, "404.html"), (fallbackError, fallback) => {
                if (fallbackError) {
                    response.writeHead(404).end("Not found");
                    return;
                }
                response.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(fallback);
            });
            return;
        }
        response.writeHead(200, {
            "content-type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream",
        });
        response.end(data);
    });
}

async function startServer() {
    const servers = [];
    for (const host of ["127.0.0.1", "::1"]) {
        const server = http.createServer(handleRequest);
        const listening = await new Promise((resolve) => {
            server.once("error", () => resolve(false));
            server.listen(PORT, host, () => resolve(true));
        });
        if (listening) servers.push(server);
        else server.close();
    }
    if (servers.length === 0) throw new Error("Unable to start the static preview server");
    return servers;
}

async function waitForTarget(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
            const targets = await response.json();
            const page = targets.find((target) => target.type === "page" && target.url.includes("localhost:3000"));
            if (page && page.webSocketDebuggerUrl) return page;
        } catch {
            void 0;
        }
        await delay(250);
    }
    throw new Error("The Electron window never exposed a DevTools target");
}

function connect(webSocketUrl) {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(webSocketUrl);
        const pending = new Map();
        const problems = [];
        let nextId = 1;

        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data);
            if (message.id && pending.has(message.id)) {
                const { resolve: settle, reject: fail } = pending.get(message.id);
                pending.delete(message.id);
                if (message.error) fail(new Error(message.error.message));
                else settle(message.result);
                return;
            }
            if (message.method === "Runtime.exceptionThrown") {
                problems.push(message.params.exceptionDetails.text || "uncaught exception");
            }
            if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
                problems.push(message.params.args.map((argument) => argument.value ?? argument.description).join(" "));
            }
            if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
                problems.push(message.params.entry.text);
            }
        });

        socket.addEventListener("error", () => reject(new Error("DevTools connection failed")));

        socket.addEventListener("open", () => {
            const send = (method, params) =>
                new Promise((settle, fail) => {
                    const id = nextId++;
                    pending.set(id, { resolve: settle, reject: fail });
                    socket.send(JSON.stringify({ id, method, params }));
                });

            const evaluate = async (expression) => {
                const result = await send("Runtime.evaluate", {
                    expression,
                    awaitPromise: true,
                    returnByValue: true,
                });
                if (result.exceptionDetails) {
                    const text =
                        result.exceptionDetails.exception?.description ||
                        result.exceptionDetails.text ||
                        "evaluation failed";
                    throw new Error(text);
                }
                return result.result.value;
            };

            Promise.all([send("Runtime.enable"), send("Log.enable")]).then(() =>
                resolve({ evaluate, problems, close: () => socket.close() })
            );
        });
    });
}

async function waitForRenderable(client) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        const ready = await client.evaluate(
            "Boolean(window.electronAPI && document.body && document.body.innerText.trim().length > 0)"
        );
        if (ready) return;
        await delay(250);
    }
    throw new Error("The renderer never finished booting");
}

async function main() {
    if (!fs.existsSync(path.join(OUT_DIR, "index.html"))) {
        throw new Error("out/index.html is missing; run npm run build:next first");
    }

    const electronBinary = require("electron");
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "prince-smoke-"));
    const inputPath = path.join(workDir, "smoke.txt");
    const plaintext = "smoke test payload\nsecond line\n";
    fs.writeFileSync(inputPath, plaintext);

    const servers = await startServer();
    const child = spawn(electronBinary, ["electron/dist/main.js", `--remote-debugging-port=${DEBUG_PORT}`], {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, ELECTRON_ENABLE_LOGGING: "1" },
    });

    let output = "";
    child.stdout.on("data", (data) => {
        output += data.toString();
    });
    child.stderr.on("data", (data) => {
        output += data.toString();
    });

    let client = null;
    try {
        const target = await waitForTarget(40000);
        client = await connect(target.webSocketDebuggerUrl);
        await waitForRenderable(client);

        const title = await client.evaluate("document.title");
        assert.match(title, /File Encrypter Decrypter/);

        const heading = await client.evaluate("document.body.innerText");
        assert.match(heading, /Your files, kept private\./);
        assert.match(heading, /Encrypt a file/);

        const api = await client.evaluate("Object.keys(window.electronAPI).sort()");
        for (const method of ["encrypt", "decrypt", "inspectFile", "generateRecoveryKey", "onProgress", "validateRecoveryKey"]) {
            assert.ok(api.includes(method), `preload is missing ${method}`);
        }

        const generated = await client.evaluate(
            "(async () => { const key = await window.electronAPI.generateRecoveryKey(); return { key, valid: await window.electronAPI.validateRecoveryKey(key) }; })()"
        );
        assert.equal(generated.valid, true);
        assert.match(generated.key, /^([0-9A-Z]{4}-){13}[0-9A-Z]{4}$/);
        const recoveryKey = generated.key;

        const encryptedPath = path.join(workDir, "smoke.txt.prince");
        const decryptPath = path.join(workDir, "smoke.out.txt");

        const progressEvents = await client.evaluate(`(async () => {
            window.__princeProgress = [];
            window.electronAPI.onProgress((info) => window.__princeProgress.push(info));
            await window.electronAPI.encrypt(${JSON.stringify({
                inputPath,
                outputPath: encryptedPath,
                passphrase: PASSPHRASE,
                confirmPassphrase: PASSPHRASE,
                recoveryKey,
                kdfId: 1,
            })});
            return window.__princeProgress;
        })()`);
        assert.ok(progressEvents.length > 0, "no progress events reached the renderer");
        assert.deepEqual(progressEvents[progressEvents.length - 1], {
            processed: Buffer.byteLength(plaintext),
            total: Buffer.byteLength(plaintext),
        });

        const version = await client.evaluate(`window.electronAPI.inspectFile(${JSON.stringify(encryptedPath)})`);
        assert.equal(version.version, 2);

        await client.evaluate(
            `window.electronAPI.decrypt(${JSON.stringify({
                inputPath: encryptedPath,
                outputPath: decryptPath,
                passphrase: PASSPHRASE,
                recoveryKey,
            })})`
        );
        assert.equal(fs.readFileSync(decryptPath, "utf8"), plaintext);

        const generic = await client.evaluate(`(async () => {
            try {
                await window.electronAPI.decrypt(${JSON.stringify({
                    inputPath: encryptedPath,
                    outputPath: path.join(workDir, "wrong.out"),
                    passphrase: "definitely the wrong passphrase",
                    recoveryKey,
                })});
                return null;
            } catch (error) {
                return error.message;
            }
        })()`);
        assert.match(generic, /Decryption failed\. Wrong passphrase or key, or the file is corrupted\./);
        assert.equal(fs.existsSync(path.join(workDir, "wrong.out")), false);

        const leftovers = fs.readdirSync(workDir).filter((name) => name.endsWith(".tmp"));
        assert.deepEqual(leftovers, []);

        await delay(500);
        const problems = client.problems.filter(
            (problem) => !/Autofill\.|Request Autofill|DevTools listening|Electron Security Warning/.test(problem)
        );
        assert.deepEqual(problems, [], `renderer reported problems:\n${problems.join("\n")}`);

        console.log("smoke passed");
        console.log(`  title: ${title}`);
        console.log(`  ipc methods: ${api.length}`);
        console.log(`  progress events: ${progressEvents.length}`);
        console.log(`  encrypted size: ${fs.statSync(encryptedPath).size} bytes`);
    } finally {
        if (client) client.close();
        child.kill();
        await delay(500);
        for (const server of servers) server.close();
        fs.rmSync(workDir, { recursive: true, force: true });
        if (process.env.PRINCE_SMOKE_VERBOSE) console.log(output);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
