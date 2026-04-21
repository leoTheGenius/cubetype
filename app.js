const GAN_MODULE_URL = "./node_modules/smartcube-web-bluetooth/dist/esm/index.mjs";
const MAC_STORAGE_KEY = "gan-cube-manual-mac";
const FACE_INDEX_TO_NAME = ["U", "R", "F", "D", "L", "B"];
const GAN_ALT_DEBUG_CHARACTERISTIC = "0000fff3-0000-1000-8000-00805f9b34fb";
const GAN_GEN2_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dc4179";
const GAN_GEN2_COMMAND_CHARACTERISTIC = "28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4";
const GAN_GEN2_STATE_CHARACTERISTIC = "28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4";
const GAN_GEN3_SERVICE = "8653000a-43e6-47b7-9cb0-5fc21d4ae340";
const GAN_GEN3_COMMAND_CHARACTERISTIC = "8653000c-43e6-47b7-9cb0-5fc21d4ae340";
const GAN_GEN3_STATE_CHARACTERISTIC = "8653000b-43e6-47b7-9cb0-5fc21d4ae340";
const GAN_GEN4_SERVICE = "00000010-0000-fff7-fff6-fff5fff4fff0";
const GAN_GEN4_COMMAND_CHARACTERISTIC = "0000fff5-0000-1000-8000-00805f9b34fb";
const GAN_GEN4_STATE_CHARACTERISTIC = "0000fff6-0000-1000-8000-00805f9b34fb";


const GAN_PROTOCOLS = [
  {
    name: "GAN Gen2",
    service: GAN_GEN2_SERVICE,
    commandCharacteristic: GAN_GEN2_COMMAND_CHARACTERISTIC,
    stateCharacteristic: GAN_GEN2_STATE_CHARACTERISTIC,
  },
  {
    name: "GAN Gen3",
    service: GAN_GEN3_SERVICE,
    commandCharacteristic: GAN_GEN3_COMMAND_CHARACTERISTIC,
    stateCharacteristic: GAN_GEN3_STATE_CHARACTERISTIC,
  },
  {
    name: "GAN Gen4",
    service: GAN_GEN4_SERVICE,
    commandCharacteristic: GAN_GEN4_COMMAND_CHARACTERISTIC,
    stateCharacteristic: GAN_GEN4_STATE_CHARACTERISTIC,
  },
];

const GAN_AES_KEY = Uint8Array.from([
  0x01, 0x02, 0x42, 0x28, 0x31, 0x91, 0x16, 0x07,
  0x20, 0x05, 0x18, 0x54, 0x42, 0x11, 0x12, 0x53,
]);
const GAN_AES_IV = Uint8Array.from([
  0x11, 0x03, 0x32, 0x28, 0x21, 0x01, 0x76, 0x27,
  0x20, 0x95, 0x78, 0x14, 0x32, 0x12, 0x02, 0x43,
]);
const GAN_AES_KEY_ALT = Uint8Array.from([
  0x05, 0x12, 0x02, 0x45, 0x02, 0x01, 0x29, 0x56,
  0x12, 0x78, 0x12, 0x76, 0x81, 0x01, 0x08, 0x03,
]);
const GAN_AES_IV_ALT = Uint8Array.from([
  0x01, 0x44, 0x28, 0x06, 0x86, 0x21, 0x22, 0x28,
  0x51, 0x05, 0x08, 0x31, 0x82, 0x02, 0x21, 0x06,
]);

const LETTER_MOVES = ["R", "R'", "L", "L'", "F", "F'", "B", "B'", "D", "D'"];
const ALL_MOVES = ["U", "U'", ...LETTER_MOVES];

const BANKS = [
  {
    name: "1 · A-J",
    entries: [
      ["R", { kind: "insert", value: "A", label: "A" }],
      ["R'", { kind: "insert", value: "B", label: "B" }],
      ["L", { kind: "insert", value: "C", label: "C" }],
      ["L'", { kind: "insert", value: "D", label: "D" }],
      ["F", { kind: "insert", value: "E", label: "E" }],
      ["F'", { kind: "insert", value: "F", label: "F" }],
      ["B", { kind: "insert", value: "G", label: "G" }],
      ["B'", { kind: "insert", value: "H", label: "H" }],
      ["D", { kind: "insert", value: "I", label: "I" }],
      ["D'", { kind: "insert", value: "J", label: "J" }],
    ],
  },
  {
    name: "2 · K-T",
    entries: [
      ["R", { kind: "insert", value: "K", label: "K" }],
      ["R'", { kind: "insert", value: "L", label: "L" }],
      ["L", { kind: "insert", value: "M", label: "M" }],
      ["L'", { kind: "insert", value: "N", label: "N" }],
      ["F", { kind: "insert", value: "O", label: "O" }],
      ["F'", { kind: "insert", value: "P", label: "P" }],
      ["B", { kind: "insert", value: "Q", label: "Q" }],
      ["B'", { kind: "insert", value: "R", label: "R" }],
      ["D", { kind: "insert", value: "S", label: "S" }],
      ["D'", { kind: "insert", value: "T", label: "T" }],
    ],
  },
  {
    name: "3 · U-Z + edit",
    entries: [
      ["R", { kind: "insert", value: "U", label: "U" }],
      ["R'", { kind: "insert", value: "V", label: "V" }],
      ["L", { kind: "insert", value: "W", label: "W" }],
      ["L'", { kind: "insert", value: "X", label: "X" }],
      ["F", { kind: "insert", value: "Y", label: "Y" }],
      ["F'", { kind: "insert", value: "Z", label: "Z" }],
      ["B", { kind: "insert", value: " ", label: "Space" }],
      ["B'", { kind: "backspace", label: "Backspace" }],
      ["D", { kind: "insert", value: ".", label: "." }],
      ["D'", { kind: "insert", value: ",", label: "," }],
    ],
  },
].map((bank) => ({
  ...bank,
  moveToEntry: Object.fromEntries(bank.entries),
}));

const refs = {
  connectBtn: document.querySelector("#connect-btn"),
  debugBtn: document.querySelector("#debug-btn"),
  disconnectBtn: document.querySelector("#disconnect-btn"),
  clearBtn: document.querySelector("#clear-btn"),
  macInput: document.querySelector("#mac-input"),
  status: document.querySelector("#status"),
  bankName: document.querySelector("#bank-name"),
  typedOutput: document.querySelector("#typed-output"),
  lastMove: document.querySelector("#last-move"),
  lastResult: document.querySelector("#last-result"),
  mappingGrid: document.querySelector("#mapping-grid"),
  simulator: document.querySelector("#simulator"),
  eventLog: document.querySelector("#event-log"),
};

const state = {
  activeBank: 0,
  text: "",
  lastMove: "-",
  lastResult: "-",
  connection: null,
  subscription: null,
  debugCleanup: [],
  debugDevice: null,
  lastDebugPacket: "",
  lastDebugRepeatCount: 0,
  cubeReady: false,
  events: [],
};

let ganModulePromise = null;

function normalizeMacAddress(rawValue) {
  const value = String(rawValue ?? "")
    .trim()
    .toUpperCase();

  if (!value) {
    return "";
  }

  const compact = value.replace(/[^A-F0-9]/g, "");
  if (/^[A-F0-9]{12}$/.test(compact)) {
    return compact.match(/.{1,2}/g).join(":");
  }

  if (/^(?:[A-F0-9]{2}[:-]){5}[A-F0-9]{2}$/.test(value)) {
    return value.replace(/-/g, ":");
  }

  return "";
}

function maskMacAddress(mac) {
  const normalized = normalizeMacAddress(mac);
  if (!normalized) {
    return "(invalid)";
  }

  const parts = normalized.split(":");
  return `${parts[0]}:${parts[1]}:..:${parts[4]}:${parts[5]}`;
}

function persistManualMac(rawValue) {
  const normalized = normalizeMacAddress(rawValue);
  refs.macInput.value = normalized || String(rawValue ?? "").trim().toUpperCase();

  if (normalized) {
    localStorage.setItem(MAC_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(MAC_STORAGE_KEY);
  }

  return normalized;
}

function getStoredManualMac() {
  return normalizeMacAddress(localStorage.getItem(MAC_STORAGE_KEY) ?? "");
}

async function provideCubeMacAddress(device, isFallbackCall = false) {
  const typedMac = persistManualMac(refs.macInput.value);
  if (typedMac && !isFallbackCall) {
    pushLog(`[ui] manual MAC stored; trying auto-detect before fallback`);
    return null;
  }

  if (typedMac) {
    pushLog(`[ui] using manual MAC ${maskMacAddress(typedMac)}`);
    return typedMac;
  }

  if (!isFallbackCall) {
    return null;
  }

  const answer = window.prompt(
    `Auto-detect could not find the hardware MAC for ${device?.name ?? "this cube"}.\nEnter it as AA:BB:CC:DD:EE:FF.`,
    refs.macInput.value || getStoredManualMac(),
  );

  if (answer === null) {
    return null;
  }

  const promptedMac = persistManualMac(answer);
  if (!promptedMac) {
    throw new Error("Invalid MAC format. Use AA:BB:CC:DD:EE:FF.");
  }

  pushLog(`[ui] stored manual MAC ${maskMacAddress(promptedMac)}`);
  return promptedMac;
}

function getTimeStamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function bytesToHex(dataView) {
  const bytes = [];
  for (let index = 0; index < dataView.byteLength; index += 1) {
    bytes.push(dataView.getUint8(index).toString(16).padStart(2, "0"));
  }
  return bytes.join(" ");
}

function bytesToHexFromArray(array) {
  return Array.from(array, (value) => value.toString(16).padStart(2, "0")).join(" ");
}

function extractGanMacFromManufacturerData(manufacturerData) {
  if (!manufacturerData) {
    return null;
  }

  let dataView = null;
  if (manufacturerData instanceof DataView) {
    dataView = manufacturerData;
  } else if (typeof manufacturerData.keys === "function" && typeof manufacturerData.get === "function") {
    for (let index = 0; index < 256; index += 1) {
      const key = (index << 8) | 0x01;
      if (manufacturerData.has(key)) {
        dataView = manufacturerData.get(key);
        break;
      }
    }
  }

  if (!dataView || dataView.byteLength < 6) {
    return null;
  }

  const macBytes = [];
  for (let index = 1; index <= 6; index += 1) {
    macBytes.push(dataView.getUint8(dataView.byteLength - index).toString(16).padStart(2, "0"));
  }
  return normalizeMacAddress(macBytes.join(":"));
}

async function watchForAdvertisementMac(device, timeoutMs = 4000) {
  if (typeof device?.watchAdvertisements !== "function") {
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    const abortController = new AbortController();

    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      device.removeEventListener("advertisementreceived", onAdvertisement);
      abortController.abort();
      resolve(value);
    };

    const onAdvertisement = (event) => {
      const mac = extractGanMacFromManufacturerData(event.manufacturerData ?? null);
      if (mac) {
        finish(mac);
      }
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);
    device.addEventListener("advertisementreceived", onAdvertisement);
    device.watchAdvertisements({ signal: abortController.signal }).catch(() => finish(null));
  });
}

function createBitString(bytes) {
  return Array.from(bytes, (byte) => (byte + 0x100).toString(2).slice(1)).join("");
}

function getBitWord(bits, startBit, bitLength, littleEndian = false) {
  if (bitLength <= 8) {
    return Number.parseInt(bits.slice(startBit, startBit + bitLength), 2);
  }

  if (bitLength === 16 || bitLength === 32) {
    const wordBytes = new Uint8Array(bitLength / 8);

    for (let index = 0; index < wordBytes.length; index += 1) {
      const offset = startBit + index * 8;
      wordBytes[index] = Number.parseInt(bits.slice(offset, offset + 8), 2);
    }

    const dataView = new DataView(wordBytes.buffer);
    return bitLength === 16
      ? dataView.getUint16(0, littleEndian)
      : dataView.getUint32(0, littleEndian);
  }

  throw new Error(`Unsupported bit word length: ${bitLength}`);
}

function decodeGanGen4Payload(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 3) {
    return null;
  }

  const bits = createBitString(bytes);
  const eventType = getBitWord(bits, 0, 8);
  const dataLength = getBitWord(bits, 8, 8);
  const summary = {
    eventType,
    dataLength,
    label: `type 0x${eventType.toString(16).padStart(2, "0")}`,
    detail: "",
  };

  if (eventType === 0x01) {
    const moves = [];
    let offset = 0;

    while (offset + 72 <= bits.length && getBitWord(bits, offset, 8) === 0x01) {
      const cubeTimestamp = getBitWord(bits, offset + 16, 32, true);
      const serial = getBitWord(bits, offset + 48, 16, true);
      const direction = getBitWord(bits, offset + 64, 2);
      const faceMask = getBitWord(bits, offset + 66, 6);
      const face = [2, 32, 8, 1, 16, 4].indexOf(faceMask);

      if (face < 0 || direction > 1) {
        break;
      }

      const move = `URFDLB`.charAt(face) + ` '`.charAt(direction);
      moves.push(`${move.trim()}#${serial}@${cubeTimestamp}`);
      offset += 72;
    }

    summary.label = "MOVE";
    summary.detail = moves.length > 0 ? moves.join(", ") : "unparsed move payload";
    return summary;
  }

  if (eventType === 0xd1) {
    const startSerial = getBitWord(bits, 16, 8);
    const count = Math.max(0, (dataLength - 1) * 2);
    const moves = [];

    for (let index = 0; index < count; index += 1) {
      const face = [1, 5, 3, 0, 4, 2].indexOf(getBitWord(bits, 24 + 4 * index, 3));
      const direction = getBitWord(bits, 27 + 4 * index, 1);

      if (face < 0 || direction > 1) {
        continue;
      }

      const move = `URFDLB`.charAt(face) + ` '`.charAt(direction);
      const serial = (startSerial - index) & 0xff;
      moves.push(`${move.trim()}#${serial}`);
    }

    summary.label = "MOVE_HISTORY";
    summary.detail = moves.length > 0 ? moves.join(", ") : `start ${startSerial}`;
    return summary;
  }

  if (eventType === 0xed) {
    const serial = getBitWord(bits, 16, 16, true);
    summary.label = "FACELETS";
    summary.detail = `serial ${serial}`;
    return summary;
  }

  if (eventType === 0xec) {
    summary.label = "GYRO";
    return summary;
  }

  if (eventType === 0xef) {
    const batteryLevel = Math.min(100, getBitWord(bits, 16, 8));
    summary.label = "BATTERY";
    summary.detail = `${batteryLevel}%`;
    return summary;
  }

  if (eventType >= 0xfa && eventType <= 0xfe) {
    const labels = {
      0xfa: "HARDWARE_DATE",
      0xfc: "HARDWARE_NAME",
      0xfd: "SOFTWARE_VERSION",
      0xfe: "HARDWARE_VERSION",
    };
    summary.label = labels[eventType] ?? summary.label;
    return summary;
  }

  if (eventType === 0xea) {
    summary.label = "DISCONNECT";
    return summary;
  }

  return summary;
}

function isLikelyValidGanGen4Packet(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) {
    return false;
  }

  try {
    const bits = createBitString(bytes);
    const eventType = getBitWord(bits, 0, 8);
    if (![0x01, 0xd1, 0xed, 0xec, 0xef, 0xea, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe].includes(eventType)) {
      return false;
    }

    if (eventType === 0x01) {
      const faceMask = getBitWord(bits, 66, 6);
      if ([2, 32, 8, 1, 16, 4].indexOf(faceMask) < 0) {
        return false;
      }
    }

    return true;
  } catch (_error) {
    return false;
  }
}

function createGanSaltedAesContext(rawMac, config = {}) {
  const normalizedMac = normalizeMacAddress(rawMac);
  if (!normalizedMac || !globalThis.aesjs?.ModeOfOperation?.cbc) {
    return null;
  }

  const {
    baseKey = GAN_AES_KEY,
    baseIv = GAN_AES_IV,
    reverseSalt = true,
    modulo = 0xff,
    label = "key0-reversed-mod255",
    source = "manual",
  } = config;
  const macBytes = normalizedMac.split(":").map((part) => Number.parseInt(part, 16));
  const salt = Uint8Array.from(reverseSalt ? [...macBytes].reverse() : macBytes);
  const key = new Uint8Array(baseKey);
  const iv = new Uint8Array(baseIv);
  for (let index = 0; index < 6; index += 1) {
    key[index] = (key[index] + salt[index]) % modulo;
    iv[index] = (iv[index] + salt[index]) % modulo;
  }

  return { key, iv, mac: normalizedMac, label, source };
}

function buildGanDebugAesContexts(macCandidates) {
  const uniqueCandidates = [];
  for (const candidate of macCandidates) {
    const normalized = normalizeMacAddress(candidate?.mac ?? "");
    if (!normalized || uniqueCandidates.some((item) => item.mac === normalized)) {
      continue;
    }
    uniqueCandidates.push({
      mac: normalized,
      source: candidate.source || "candidate",
    });
  }

  const variants = [];
  const recipes = [
    { label: "key0-reversed-mod255", baseKey: GAN_AES_KEY, baseIv: GAN_AES_IV, reverseSalt: true, modulo: 0xff },
    { label: "key1-reversed-mod255", baseKey: GAN_AES_KEY_ALT, baseIv: GAN_AES_IV_ALT, reverseSalt: true, modulo: 0xff },
    { label: "key0-forward-mod255", baseKey: GAN_AES_KEY, baseIv: GAN_AES_IV, reverseSalt: false, modulo: 0xff },
    { label: "key0-reversed-mod256", baseKey: GAN_AES_KEY, baseIv: GAN_AES_IV, reverseSalt: true, modulo: 0x100 },
  ];

  for (const candidate of uniqueCandidates) {
    for (const recipe of recipes) {
      const context = createGanSaltedAesContext(candidate.mac, {
        ...recipe,
        source: candidate.source,
      });
      if (context) {
        variants.push(context);
      }
    }
  }

  return variants;
}

function decryptGanPacketWithVariants(dataView, aesContexts) {
  if (!Array.isArray(aesContexts) || aesContexts.length === 0) {
    return { decrypted: null, context: null, valid: false };
  }

  let fallback = null;
  for (const context of aesContexts) {
    const decrypted = decryptGanPacket(dataView, context);
    if (!decrypted) {
      continue;
    }
    if (!fallback) {
      fallback = { decrypted, context, valid: false };
    }
    if (isLikelyValidGanGen4Packet(decrypted)) {
      return { decrypted, context, valid: true };
    }
  }

  return fallback ?? { decrypted: null, context: null, valid: false };
}

function decryptGanPacket(dataView, aesContext) {
  if (!aesContext || dataView.byteLength < 16) {
    return null;
  }

  const result = new Uint8Array(
    dataView.buffer.slice(dataView.byteOffset, dataView.byteOffset + dataView.byteLength),
  );
  const decryptChunk = (offset) => {
    const cipher = new globalThis.aesjs.ModeOfOperation.cbc(aesContext.key, aesContext.iv);
    const chunk = cipher.decrypt(result.subarray(offset, offset + 16));
    result.set(chunk, offset);
  };

  if (result.length > 16) {
    decryptChunk(result.length - 16);
  }
  decryptChunk(0);
  return result;
}

function encryptGanPacket(data, aesContext) {
  if (!aesContext || data.length < 16) {
    return null;
  }

  const result = new Uint8Array(data);
  const encryptChunk = (offset) => {
    const cipher = new globalThis.aesjs.ModeOfOperation.cbc(aesContext.key, aesContext.iv);
    const chunk = cipher.encrypt(result.subarray(offset, offset + 16));
    result.set(chunk, offset);
  };

  encryptChunk(0);
  if (result.length > 16) {
    encryptChunk(result.length - 16);
  }
  return result;
}

function moveSuffixFromAmount(amount) {
  if (amount === 2 || amount === -2) {
    return "2";
  }
  if (amount === -1 || amount === 3 || amount === -3) {
    return "'";
  }
  return "";
}

function normalizeMove(move) {
  if (!move) {
    return "";
  }

  if (typeof move === "string") {
    return move.trim();
  }

  if (typeof move.toString === "function") {
    const direct = move.toString().trim();
    if (direct && direct !== "[object Object]") {
      return direct;
    }
  }

  if (typeof move === "object") {
    const face =
      (typeof move.notation === "string" && move.notation) ||
      (typeof move.name === "string" && move.name) ||
      (typeof move.family === "string" && move.family) ||
      (typeof move.face === "string" && move.face) ||
      (typeof move.faceName === "string" && move.faceName) ||
      (typeof move.side === "string" && move.side) ||
      (typeof move.face === "number" && FACE_INDEX_TO_NAME[move.face]) ||
      "";
    const amount =
      (typeof move.amount === "number" && move.amount) ||
      (typeof move.power === "number" && move.power) ||
      (typeof move.count === "number" && move.count) ||
      (typeof move.turns === "number" && move.turns) ||
      (typeof move.direction === "number" && move.direction) ||
      (typeof move.clockwise === "boolean" && (move.clockwise ? 1 : -1));

    if (typeof face === "string" && /[URFDLB]/i.test(face)) {
      if (/^[URFDLB]['2]?$/.test(face.trim())) {
        return face.trim().toUpperCase().replace("’", "'");
      }
      return `${face.toUpperCase()}${moveSuffixFromAmount(amount ?? 1)}`;
    }
  }

  return String(move).trim();
}

function pushLog(message) {
  state.events.unshift({ time: getTimeStamp(), message });
  state.events = state.events.slice(0, 14);
  renderLog();
}

function pushCollapsedDebug(message) {
  if (state.lastDebugPacket === message && state.events.length > 0) {
    state.lastDebugRepeatCount += 1;
    const latest = state.events[0];
    latest.message = `${message} [x${state.lastDebugRepeatCount}]`;
    latest.time = getTimeStamp();
    renderLog();
    return;
  }

  state.lastDebugPacket = message;
  state.lastDebugRepeatCount = 1;
  pushLog(message);
}

function setStatus(message, tone = "neutral") {
  refs.status.textContent = message;
  refs.status.dataset.tone = tone;
}

function setLast(move, result) {
  state.lastMove = move;
  state.lastResult = result;
}

function updateOutput() {
  refs.bankName.textContent = BANKS[state.activeBank].name;
  refs.lastMove.textContent = state.lastMove;
  refs.lastResult.textContent = state.lastResult;
  refs.typedOutput.textContent = state.text || "(no letters yet)";
  refs.typedOutput.classList.toggle("placeholder", state.text.length === 0);
  renderMapping();
}

function renderLog() {
  refs.eventLog.replaceChildren(
    ...state.events.map((entry) => {
      const item = document.createElement("li");

      const stamp = document.createElement("span");
      stamp.className = "time-stamp";
      stamp.textContent = entry.time;

      const message = document.createElement("span");
      message.className = "log-message";
      message.textContent = entry.message;

      item.append(stamp, message);
      return item;
    }),
  );
}

function renderMapping() {
  refs.mappingGrid.replaceChildren(
    ...BANKS.map((bank, bankIndex) => {
      const card = document.createElement("section");
      card.className =
        bankIndex === state.activeBank ? "mapping-card active" : "mapping-card";

      const title = document.createElement("h2");
      title.textContent = bank.name;

      const rows = bank.entries.map(([move, entry]) => {
        const row = document.createElement("div");
        row.className =
          entry.kind === "insert" && /^[A-Z]$/.test(entry.value)
            ? "move-row"
            : "move-row utility";

        const moveCode = document.createElement("code");
        moveCode.textContent = move;

        const label = document.createElement("strong");
        label.textContent = entry.label;

        row.append(moveCode, label);
        return row;
      });

      card.append(title, ...rows);
      return card;
    }),
  );
}

function clearText() {
  state.text = "";
}

function appendText(fragment) {
  state.text += fragment;
}

function backspaceText() {
  state.text = state.text.slice(0, -1);
}

function markCubeReady(reason) {
  if (state.cubeReady) {
    return;
  }

  state.cubeReady = true;
  setStatus(
    "GAN cube move stream is live. Hold white on top and green on the front, then type.",
    "success",
  );
  pushLog(reason);
}

function handleMappedEntry(entry, move, source) {
  if (entry.kind === "backspace") {
    backspaceText();
    setLast(move, entry.label);
    pushLog(`[${source}] ${move} -> ${entry.label.toLowerCase()}`);
    updateOutput();
    return;
  }

  appendText(entry.value);
  setLast(move, entry.label);
  pushLog(`[${source}] ${move} -> ${entry.label}`);
  updateOutput();
}

function handleCommandMove(move, source) {
  if (move === "U") {
    state.activeBank = (state.activeBank + 1) % BANKS.length;
    setLast(move, `Dictionary ${BANKS[state.activeBank].name}`);
    pushLog(`[${source}] ${move} -> ${BANKS[state.activeBank].name}`);
    updateOutput();
    return true;
  }

  if (move === "U'") {
    state.activeBank = (state.activeBank - 1 + BANKS.length) % BANKS.length;
    setLast(move, `Dictionary ${BANKS[state.activeBank].name}`);
    pushLog(`[${source}] ${move} -> ${BANKS[state.activeBank].name}`);
    updateOutput();
    return true;
  }

  return false;
}

function handleMove(moveValue, source) {
  const move = normalizeMove(moveValue);
  if (!move) {
    pushLog(`[${source}] received empty move payload`);
    return;
  }

  if (source === "cube") {
    markCubeReady("[cube] live move event received");
  }

  if (handleCommandMove(move, source)) {
    return;
  }

  const entry = BANKS[state.activeBank].moveToEntry[move];
  if (!entry) {
    setLast(move, "Ignored");
    pushLog(`[${source}] ${move} -> ignored`);
    updateOutput();
    return;
  }

  handleMappedEntry(entry, move, source);
}

function disconnectCube({ quiet = false, preserveStatus = false } = {}) {
  if (state.subscription && typeof state.subscription.unsubscribe === "function") {
    state.subscription.unsubscribe();
  }
  state.subscription = null;

  while (state.debugCleanup.length > 0) {
    const cleanup = state.debugCleanup.pop();
    try {
      cleanup();
    } catch (_error) {
      // Ignore debug cleanup failures.
    }
  }

  if (state.debugDevice?.gatt?.connected) {
    try {
      state.debugDevice.gatt.disconnect();
    } catch (_error) {
      // Ignore debug disconnect failures.
    }
  }
  state.debugDevice = null;

  if (state.connection && typeof state.connection.disconnect === "function") {
    try {
      state.connection.disconnect();
    } catch (_error) {
      // Ignore disconnect cleanup errors.
    }
  }

  state.connection = null;
  state.cubeReady = false;
  state.lastDebugPacket = "";
  state.lastDebugRepeatCount = 0;
  refs.disconnectBtn.disabled = true;

  if (!preserveStatus) {
    setStatus("Disconnected. Click Connect to pair again.");
  }

  if (!quiet) {
    pushLog("[cube] disconnected");
  }
}

async function loadGanModule() {
  if (!ganModulePromise) {
    ganModulePromise = import(GAN_MODULE_URL).catch((error) => {
      ganModulePromise = null;
      throw error;
    });
  }
  return ganModulePromise;
}

async function sendInitialCubeRequests(connection) {
  const sendCommand =
    typeof connection?.sendCommand === "function"
      ? (command) => connection.sendCommand(command)
      : typeof connection?.sendCubeCommand === "function"
        ? (command) => connection.sendCubeCommand(command)
        : null;

  if (!sendCommand) {
    return;
  }

  const commands = [
    { type: "REQUEST_FACELETS" },
    { type: "REQUEST_HARDWARE" },
  ];

  for (const command of commands) {
    try {
      await sendCommand(command);
      pushLog(`[cube] sent ${command.type}`);
    } catch (error) {
      pushLog(`[cube] ${command.type} failed: ${formatError(error)}`);
    }
  }
}

function createEventStream() {
  const observers = new Set();

  return {
    next(event) {
      for (const observer of observers) {
        observer?.next?.(event);
      }
    },
    error(error) {
      for (const observer of observers) {
        observer?.error?.(error);
      }
    },
    complete() {
      for (const observer of observers) {
        observer?.complete?.();
      }
      observers.clear();
    },
    subscribe(observer) {
      observers.add(observer);
      return {
        unsubscribe() {
          observers.delete(observer);
        },
      };
    },
  };
}

function createGanGen4CommandMessage(command) {
  const message = new Uint8Array(20);

  switch (command?.type) {
    case "REQUEST_FACELETS":
      message.set([0xdd, 0x04, 0x00, 0xed, 0x00, 0x00]);
      return message;
    case "REQUEST_HARDWARE":
      message.set([0xdf, 0x03, 0x00, 0x00, 0x00]);
      return message;
    case "REQUEST_BATTERY":
      message.set([0xdd, 0x04, 0x00, 0xef, 0x00, 0x00]);
      return message;
    case "REQUEST_RESET":
      message.set([
        0xd2, 0x0d, 0x05, 0x39, 0x77, 0x00, 0x00, 0x01,
        0x23, 0x45, 0x67, 0x89, 0xab, 0x00, 0x00, 0x00,
      ]);
      return message;
    default:
      return null;
  }
}

function createGanGen4ParserState() {
  return {
    lastMoveSerial: null,
    lastFaceletsSerial: null,
    hardwareInfo: {},
  };
}

function parseGanGen4Events(bytes, parserState) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 3) {
    return [];
  }

  const bits = createBitString(bytes);
  const eventType = getBitWord(bits, 0, 8);
  const dataLength = getBitWord(bits, 8, 8);
  const timestamp = Date.now();
  const events = [];

  if (eventType === 0x01) {
    let offset = 0;

    while (offset + 72 <= bits.length && getBitWord(bits, offset, 8) === 0x01) {
      const cubeTimestamp = getBitWord(bits, offset + 16, 32, true);
      const serial = getBitWord(bits, offset + 48, 16, true);
      const direction = getBitWord(bits, offset + 64, 2);
      const faceMask = getBitWord(bits, offset + 66, 6);
      const face = [2, 32, 8, 1, 16, 4].indexOf(faceMask);

      if (face < 0 || direction > 1) {
        break;
      }

      if (serial !== parserState.lastMoveSerial) {
        const move = `URFDLB`.charAt(face) + ` '`.charAt(direction);
        parserState.lastMoveSerial = serial;
        events.push({
          type: "MOVE",
          timestamp,
          serial,
          face,
          direction,
          move: move.trim(),
          localTimestamp: timestamp,
          cubeTimestamp,
        });
      }

      offset += 72;
    }

    return events;
  }

  if (eventType === 0xd1) {
    const startSerial = getBitWord(bits, 16, 8);
    const count = Math.max(0, (dataLength - 1) * 2);

    for (let index = 0; index < count; index += 1) {
      const face = [1, 5, 3, 0, 4, 2].indexOf(getBitWord(bits, 24 + 4 * index, 3));
      const direction = getBitWord(bits, 27 + 4 * index, 1);
      const serial = (startSerial - index) & 0xff;

      if (face < 0 || direction > 1 || serial === parserState.lastMoveSerial) {
        continue;
      }

      const move = `URFDLB`.charAt(face) + ` '`.charAt(direction);
      parserState.lastMoveSerial = serial;
      events.push({
        type: "MOVE",
        timestamp,
        serial,
        face,
        direction,
        move: move.trim(),
        localTimestamp: null,
        cubeTimestamp: null,
      });
    }

    return events;
  }

  if (eventType === 0xed) {
    const serial = getBitWord(bits, 16, 16, true);
    parserState.lastFaceletsSerial = serial;
    return [{ type: "FACELETS", timestamp, serial }];
  }

  if (eventType === 0xea) {
    return [{ type: "DISCONNECT", timestamp }];
  }

  if (eventType >= 0xfa && eventType <= 0xfe) {
    const info = parserState.hardwareInfo;
    if (eventType === 0xfa) {
      const year = getBitWord(bits, 24, 16, true);
      const month = getBitWord(bits, 40, 8);
      const day = getBitWord(bits, 48, 8);
      info.productDate = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    } else if (eventType === 0xfc) {
      let hardwareName = "";
      for (let index = 0; index < dataLength - 1; index += 1) {
        hardwareName += String.fromCharCode(getBitWord(bits, index * 8 + 24, 8));
      }
      info.hardwareName = hardwareName;
    } else if (eventType === 0xfd) {
      info.softwareVersion = `${getBitWord(bits, 24, 4)}.${getBitWord(bits, 28, 4)}`;
    } else if (eventType === 0xfe) {
      info.hardwareVersion = `${getBitWord(bits, 24, 4)}.${getBitWord(bits, 28, 4)}`;
    }

    return [];
  }

  return [];
}

async function writeCharacteristicValue(characteristic, value) {
  if (typeof characteristic.writeValueWithResponse === "function") {
    await characteristic.writeValueWithResponse(value);
    return;
  }

  if (typeof characteristic.writeValue === "function") {
    await characteristic.writeValue(value);
    return;
  }

  throw new Error("Bluetooth characteristic does not support writes.");
}

async function waitForSelectedAesContext(connection, timeoutMs = 2500) {
  if (connection.selectedAesContext) {
    return connection.selectedAesContext;
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("No valid AES context detected yet."));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      connection.waiters.delete(onReady);
    };

    const onReady = (context) => {
      cleanup();
      resolve(context);
    };

    connection.waiters.add(onReady);
  });
}

async function connectGanGen4Direct() {
  const manualMac = persistManualMac(refs.macInput.value) || getStoredManualMac();
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "GAN" }, { namePrefix: "MG" }, { namePrefix: "AiCube" }],
    optionalServices: [GAN_GEN4_SERVICE],
  });
  const advertisementMac = await watchForAdvertisementMac(device);
  const fallbackMac =
    advertisementMac ||
    manualMac ||
    (await provideCubeMacAddress(device, true));
  const aesContexts = buildGanDebugAesContexts([
    { mac: advertisementMac, source: "advertisement" },
    { mac: fallbackMac, source: advertisementMac ? "fallback" : "manual" },
    { mac: manualMac, source: "manual" },
  ]);

  if (advertisementMac) {
    pushLog(`[cube] advertisement MAC ${maskMacAddress(advertisementMac)}`);
  } else {
    pushLog("[cube] advertisement MAC unavailable");
  }

  if (manualMac && advertisementMac && manualMac !== advertisementMac) {
    pushLog(`[cube] manual MAC ${maskMacAddress(manualMac)} differs from advertisement MAC`);
  }

  if (aesContexts.length === 0) {
    throw new Error("Unable to determine cube MAC address, connection is not possible.");
  }

  const gatt = await device.gatt.connect();
  const service = await gatt.getPrimaryService(GAN_GEN4_SERVICE);
  const commandCharacteristic = await service.getCharacteristic(GAN_GEN4_COMMAND_CHARACTERISTIC);
  const stateCharacteristic = await service.getCharacteristic(GAN_GEN4_STATE_CHARACTERISTIC);
  const events$ = createEventStream();
  const parserState = createGanGen4ParserState();

  const connection = {
    deviceName: device.name || "GAN-XXXX",
    deviceMAC: fallbackMac || "",
    device,
    gatt,
    commandCharacteristic,
    stateCharacteristic,
    aesContexts,
    selectedAesContext: null,
    waiters: new Set(),
    events$,
    async sendCommand(command) {
      const message = createGanGen4CommandMessage(command);
      if (!message) {
        return;
      }

      const context = await waitForSelectedAesContext(connection);
      const encrypted = encryptGanPacket(message, context);
      if (!encrypted) {
        throw new Error("Failed to encrypt GAN command.");
      }
      await writeCharacteristicValue(commandCharacteristic, encrypted);
    },
    async disconnect() {
      stateCharacteristic.removeEventListener("characteristicvaluechanged", onStateChanged);
      device.removeEventListener("gattserverdisconnected", onDisconnected);
      await stateCharacteristic.stopNotifications().catch(() => {});
      if (gatt.connected) {
        gatt.disconnect();
      }
      events$.complete();
    },
  };

  const selectContext = (context) => {
    if (!context) {
      return;
    }

    const current = connection.selectedAesContext;
    if (
      current &&
      current.label === context.label &&
      current.mac === context.mac &&
      current.source === context.source
    ) {
      return;
    }

    connection.selectedAesContext = context;
    connection.deviceMAC = context.mac;
    persistManualMac(context.mac);
    pushLog(`[cube] using AES ${context.source}/${context.label}/${maskMacAddress(context.mac)}`);

    for (const waiter of [...connection.waiters]) {
      waiter(context);
    }
  };

  const onStateChanged = (event) => {
    try {
      const value = event.target?.value;
      if (!value) {
        return;
      }

      const preferredResult = connection.selectedAesContext
        ? {
            decrypted: decryptGanPacket(value, connection.selectedAesContext),
            context: connection.selectedAesContext,
            valid: isLikelyValidGanGen4Packet(
              decryptGanPacket(value, connection.selectedAesContext) ?? new Uint8Array(),
            ),
          }
        : null;
      const decryptedResult =
        preferredResult?.valid
          ? preferredResult
          : decryptGanPacketWithVariants(value, connection.aesContexts);

      if (!decryptedResult.decrypted || !decryptedResult.valid) {
        return;
      }

      selectContext(decryptedResult.context);
      for (const cubeEvent of parseGanGen4Events(decryptedResult.decrypted, parserState)) {
        events$.next(cubeEvent);
      }
    } catch (error) {
      events$.error(error);
    }
  };

  const onDisconnected = () => {
    events$.next({ type: "DISCONNECT", timestamp: Date.now() });
    events$.complete();
  };

  stateCharacteristic.addEventListener("characteristicvaluechanged", onStateChanged);
  device.addEventListener("gattserverdisconnected", onDisconnected);
  await stateCharacteristic.startNotifications();

  try {
    await waitForSelectedAesContext(connection, 2500);
  } catch (_error) {
    pushLog("[cube] no valid AES context locked yet; waiting for more packets");
  }

  return connection;
}

async function requestRawDebugConnection() {
  const debugMac = persistManualMac(refs.macInput.value) || getStoredManualMac();

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "GAN" }, { namePrefix: "MG" }, { namePrefix: "AiCube" }],
    optionalServices: GAN_PROTOCOLS.map((protocol) => protocol.service),
  });
  const advertisementMac = await watchForAdvertisementMac(device);
  const aesContexts = buildGanDebugAesContexts([
    { mac: advertisementMac, source: "advertisement" },
    { mac: debugMac, source: "manual" },
  ]);

  const gatt = await device.gatt.connect();
  state.debugDevice = device;

  const services = await gatt.getPrimaryServices();
  pushLog(
    `[debug] primary services: ${services.map((service) => service.uuid).join(", ") || "(none)"}`,
  );
  pushLog(
    advertisementMac
      ? `[debug] advertisement MAC ${maskMacAddress(advertisementMac)}`
      : "[debug] advertisement MAC unavailable",
  );
  if (debugMac && advertisementMac && debugMac !== advertisementMac) {
    pushLog(
      `[debug] manual MAC ${maskMacAddress(debugMac)} differs from advertisement MAC`,
    );
  }
  pushLog(
    aesContexts.length > 0
      ? `[debug] testing ${aesContexts.length} AES decode variant(s)`
      : "[debug] no MAC available for AES decode; logging raw packets only",
  );

  let matchedProtocol = null;
  for (const protocol of GAN_PROTOCOLS) {
    const service = services.find(
      (candidate) => candidate.uuid.toLowerCase() === protocol.service.toLowerCase(),
    );
    if (!service) {
      continue;
    }

    matchedProtocol = protocol;
    pushLog(`[debug] matched ${protocol.name} service ${service.uuid}`);

    const characteristics = await service.getCharacteristics();
    pushLog(
      `[debug] characteristics: ${characteristics.map((c) => c.uuid).join(", ") || "(none)"}`,
    );

    const notifyCharacteristics = characteristics.filter((characteristic) =>
      new Set([
        protocol.stateCharacteristic.toLowerCase(),
        GAN_ALT_DEBUG_CHARACTERISTIC.toLowerCase(),
      ]).has(characteristic.uuid.toLowerCase()),
    );

    if (notifyCharacteristics.length === 0) {
      pushLog(
        `[debug] no matching notify characteristic found for ${protocol.name} (${protocol.stateCharacteristic} or ${GAN_ALT_DEBUG_CHARACTERISTIC})`,
      );
      continue;
    }

    for (const characteristic of notifyCharacteristics) {
      const onValueChanged = (event) => {
        const value = event.target?.value;
        if (!value) {
          pushLog("[debug] notification with empty payload");
          return;
        }
        const payload = bytesToHex(value);
        const decryptedResult =
          protocol.name === "GAN Gen4"
            ? decryptGanPacketWithVariants(value, aesContexts)
            : {
                decrypted: decryptGanPacket(value, aesContexts[0] ?? null),
                context: aesContexts[0] ?? null,
                valid: false,
              };
        const decrypted = decryptedResult.decrypted;
        const gen4Summary =
          protocol.name === "GAN Gen4" && decrypted
            ? decodeGanGen4Payload(decrypted)
            : null;
        const decryptedText = decrypted
          ? ` -> dec ${bytesToHexFromArray(decrypted)}`
          : "";
        const keyText = decryptedResult.context
          ? ` -> aes ${decryptedResult.context.source}/${decryptedResult.context.label}/${maskMacAddress(decryptedResult.context.mac)}${decryptedResult.valid ? " valid" : " invalid"}`
          : "";
        const parsedText = gen4Summary
          ? ` -> ${gen4Summary.label}${gen4Summary.detail ? ` ${gen4Summary.detail}` : ""}`
          : "";
        pushCollapsedDebug(
          `[debug] ${protocol.name} ${characteristic.uuid} (${value.byteLength}b) ${payload}${decryptedText}${keyText}${parsedText}`,
        );
      };

      characteristic.addEventListener("characteristicvaluechanged", onValueChanged);
      state.debugCleanup.push(() => {
        characteristic.removeEventListener("characteristicvaluechanged", onValueChanged);
        });
      await characteristic.startNotifications();
      pushLog(`[debug] listening on ${protocol.name} ${characteristic.uuid}`);

      // Also listen on the GAN Gen4 debug characteristic (FFF3) — needed for GAN i4
      try {
        const debugChar = await service.getCharacteristic(GAN_ALT_DEBUG_CHARACTERISTIC);
        await debugChar.startNotifications();
        debugChar.addEventListener("characteristicvaluechanged", onValueChanged);

        state.debugCleanup.push(() => {
          debugChar.removeEventListener("characteristicvaluechanged", onValueChanged);
        });

        pushLog(`[debug] listening on GAN Gen4 debug ${GAN_ALT_DEBUG_CHARACTERISTIC}`);
      } catch (err) {
        pushLog(`[debug] no debug characteristic available: ${formatError(err)}`);
}

    }
    break;
  }

  if (!matchedProtocol) {
    pushLog("[debug] no known GAN cube service matched this device");
  }

  device.addEventListener("gattserverdisconnected", () => {
    pushLog("[debug] device disconnected");
    state.debugDevice = null;
    refs.disconnectBtn.disabled = true;
  });
  state.debugCleanup.push(() => {});
}

function onCubeEvent(event) {
  if (!event || typeof event !== "object") {
    return;
  }

  if (event.type === "MOVE") {
    handleMove(event.move, "cube");
    return;
  }

  if (event.type === "FACELETS") {
    pushLog("[cube] facelets update received");
    return;
  }

  if (event.type === "DISCONNECT") {
    const hadMoves = state.cubeReady;
    disconnectCube({ quiet: true, preserveStatus: true });
    setStatus(
      hadMoves
        ? "Cube disconnected."
        : "GAN cube connected but no move stream arrived. GAN i4 is newer than the public support lists, so this is likely a protocol mismatch.",
      "error",
    );
    pushLog("[cube] disconnected");
  }
}

async function connectCube() {
  if (!("bluetooth" in navigator)) {
    setStatus(
      "This browser does not expose Web Bluetooth. Use desktop Chrome or Edge.",
      "error",
    );
    return;
  }

  refs.connectBtn.disabled = true;
  setStatus("Loading GAN cube Bluetooth support...", "working");

  try {
    const { connectGanCube } = await loadGanModule();

    setStatus("Waiting for the GAN cube chooser...", "working");
    const connection = await connectGanCube(provideCubeMacAddress);

    disconnectCube({ quiet: true, preserveStatus: true });

    state.connection = connection;
    state.cubeReady = false;
    state.subscription = connection.events$.subscribe({
      next: onCubeEvent,
      error: (error) => {
        setStatus(`Cube stream error: ${formatError(error)}`, "error");
        pushLog(`[cube] stream error: ${formatError(error)}`);
        disconnectCube({ quiet: true, preserveStatus: true });
      },
    });
    await sendInitialCubeRequests(connection);

    refs.disconnectBtn.disabled = false;
    setStatus(
      "GAN cube connected. Hold white on top and green on the front, then make a test turn.",
      "success",
    );
    pushLog("[cube] connected");
  } catch (error) {
    setStatus(`Connection failed: ${formatError(error)}`, "error");
    pushLog(`[cube] connect failed: ${formatError(error)}`);
  } finally {
    refs.connectBtn.disabled = false;
  }
}

async function debugCube() {
  if (!("bluetooth" in navigator)) {
    setStatus(
      "This browser does not expose Web Bluetooth. Use desktop Chrome or Edge.",
      "error",
    );
    return;
  }

  refs.debugBtn.disabled = true;
  setStatus("Opening raw GAN debug connection...", "working");

  try {
    disconnectCube({ quiet: true, preserveStatus: true });
    await requestRawDebugConnection();
    refs.disconnectBtn.disabled = false;
    setStatus(
      "Raw debug connected. Make 3-5 turns and copy the new [debug] lines from the event log.",
      "success",
    );
  } catch (error) {
    setStatus(`Raw debug failed: ${formatError(error)}`, "error");
    pushLog(`[debug] connect failed: ${formatError(error)}`);
  } finally {
    refs.debugBtn.disabled = false;
  }
}

function renderSimulator() {
  refs.simulator.replaceChildren(
    ...ALL_MOVES.map((move) => {
      const button = document.createElement("button");
      const isCommand = move === "U" || move === "U'";

      button.type = "button";
      button.textContent = move;
      button.className = isCommand ? "move-button command" : "move-button";
      button.addEventListener("click", () => handleMove(move, "sim"));
      return button;
    }),
  );
}

refs.connectBtn.addEventListener("click", connectCube);
refs.debugBtn.addEventListener("click", debugCube);
refs.disconnectBtn.addEventListener("click", () => disconnectCube());
refs.clearBtn.addEventListener("click", () => {
  clearText();
  setLast("UI", "Clear");
  updateOutput();
  pushLog("[ui] clear text");
});
refs.macInput.addEventListener("change", () => {
  const normalized = persistManualMac(refs.macInput.value);
  if (normalized) {
    setStatus(`Saved manual MAC ${maskMacAddress(normalized)}.`, "success");
    pushLog(`[ui] saved manual MAC ${maskMacAddress(normalized)}`);
    return;
  }

  if (refs.macInput.value.trim()) {
    setStatus("Manual MAC is invalid. Use AA:BB:CC:DD:EE:FF.", "error");
    return;
  }

  setStatus("Cleared manual MAC override.", "neutral");
});

const storedMac = getStoredManualMac();
if (storedMac) {
  refs.macInput.value = storedMac;
}

renderMapping();
renderSimulator();
renderLog();
updateOutput();
