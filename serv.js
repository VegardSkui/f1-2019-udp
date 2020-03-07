const WebSocket = require("ws")
const http = require("http")
const fs = require("fs")
const dgram = require("dgram")
const server = dgram.createSocket("udp4")

server.on("error", error => {
	console.error(`server error:\n${error.stack}`)
	server.close()
})

class PacketHeader {
	/**
	 * Extracts the packet header from the packet buffer
	 *
	 * @param {Buffer} buffer
	 */
	constructor(buffer) {
		this.m_packetFormat     = buffer.readUInt16LE(0)
		this.m_gameMajorVersion = buffer.readUInt8(2)
		this.m_gameMinorVersion = buffer.readUInt8(3)
		this.m_packetVersion    = buffer.readUInt8(4)
		this.m_packetId         = buffer.readUInt8(5)
		this.m_sessionUID       = buffer.readBigUInt64LE(6)
		this.m_sessionTime      = buffer.readFloatLE(14)
		this.m_frameIdentifier  = buffer.readUInt32LE(18)
		this.m_playerCarIndex   = buffer.readUInt8(22)
	}
}

class MotionPacket {
	/**
	 * Extracts the motion data from the packet buffer
	 *
	 * @param {Buffer} buffer
	 */
	constructor(buffer) {
		this.m_header = new PacketHeader(buffer)

		this.m_carMotionData = []
		for (let i = 0; i < 20; i++) this.m_carMotionData.push(new CarMotionData(buffer, 23 + i * 60))

		// TODO: Extra player car ONLY data
	}
}

class StatusPacket {
	/**
	 * @param {Buffer} buffer
	 */
	constructor(buffer) {
		this.m_header = new PacketHeader(buffer)

		this.m_carStatusData = []
		for (let i = 0; i < 20; i++) this.m_carStatusData.push(new CarStatusData(buffer, 23 + i * XX))
	}
}

class TelemetryPacket {
	/**
	 * @param {Buffer} buffer
	 */
	constructor(buffer) {
		this.m_header = new PacketHeader(buffer)

		this.m_carTelemetryData = []
		for (let i = 0; i < 20; i++) this.m_carTelemetryData.push(new CarTelemetryData(buffer, 23 + i * 66))
	}
}

class CarTelemetryData {
	/**
	 * @param {Buffer} buffer
	 * @param {Number} offset
	 */
	constructor(buffer, offset) {
		this.m_speed            = buffer.readUInt16LE(offset)
		this.m_throttle         = buffer.readFloatLE(offset + 2)
		this.m_steer            = buffer.readFloatLE(offset + 6)
		this.m_brake            = buffer.readFloatLE(offset + 10)
		this.m_clutch           = buffer.readUInt8(offset + 14)
		this.m_gear             = buffer.readInt8(offset + 15)
		this.m_engineRPM        = buffer.readUInt16LE(offset + 16)
		this.m_drs              = buffer.readUInt8(offset + 18)
		this.m_revLightsPercent = buffer.readUInt8(offset + 19)

		this.m_brakesTemperature = []
		for (let i = offset + 20; i < offset + 28; i += 2) this.m_brakesTemperature.push(buffer.readUInt16LE(i))

		this.m_tyreSurfaceTemperature = []
		for (let i = offset + 28; i < offset + 36; i += 2) this.m_tyreSurfaceTemperature.push(buffer.readUInt16LE(i))

		this.m_tyresInnerTemperature = []
		for (let i = offset + 36; i < offset + 44; i += 2) this.m_tyresInnerTemperature.push(buffer.readUInt16LE(i))

		this.m_engineTemperature = buffer.readUInt16LE(offset + 44)

		this.m_tyresPressure = []
		for (let i = offset + 46; i < offset + 62; i += 4) this.m_tyresPressure.push(buffer.readFloatLE(i))

		this.m_surfaceType = []
		for (let i = offset + 62; i < offset + 66; i++) this.m_surfaceType.push(buffer.readUInt8(i))
	}
}

class CarStatusData {
	/**
	 * @param {Buffer} buffer
	 * @param {Number} offset
	 */
	constructor(buffer, offset) {

	}
}

class CarMotionData {
	/**
	 * @param {Buffer} buffer
	 * @param {Number} offset
	 */
	constructor(buffer, offset) {
		this.m_worldPositionX     = buffer.readFloatLE(offset)
		this.m_worldPositionY     = buffer.readFloatLE(offset + 4)
		this.m_worldPositionZ     = buffer.readFloatLE(offset + 8)
		this.m_worldVelocityX     = buffer.readFloatLE(offset + 12)
		this.m_worldVelocityY     = buffer.readFloatLE(offset + 16)
		this.m_worldVelocityZ     = buffer.readFloatLE(offset + 20)
		this.m_worldForwardDirX   = buffer.readInt16LE(offset + 24)
		this.m_worldForwardDirY   = buffer.readInt16LE(offset + 26)
		this.m_worldForwardDirZ   = buffer.readInt16LE(offset + 28)
		this.m_worldRightDirX     = buffer.readInt16LE(offset + 30)
		this.m_worldRightDirY     = buffer.readInt16LE(offset + 32)
		this.m_worldRightDirZ     = buffer.readInt16LE(offset + 34)
		this.m_gForceLateral      = buffer.readFloatLE(offset + 36)
		this.m_gForceLongitudinal = buffer.readFloatLE(offset + 40)
		this.m_gForceVertical     = buffer.readFloatLE(offset + 44)
		this.m_yaw                = buffer.readFloatLE(offset + 48)
		this.m_pitch              = buffer.readFloatLE(offset + 52)
		this.m_roll               = buffer.readFloatLE(offset + 56)
	}
}

server.on("message", (msg, rinfo) => {
	let format = msg.readUInt16LE(0)
	if (format != 2019) console.info(`Discarded packet from ${rinfo.address}:${rinfo.port} with format ${format}`)

	let packetId = msg.readUInt8(5)

	if (packetId == 6) {
		let telemetry = new TelemetryPacket(msg)
		console.log(telemetry.m_carTelemetryData[telemetry.m_header.m_playerCarIndex])
		wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				telemetry.m_header.m_sessionUID = null // we can't stringify bigints
				client.send(JSON.stringify(telemetry))
			}
		})
	}
})

server.on("listening", () => {
	const address = server.address()
	console.log(`server listening on ${address.address}:${address.port}`)
})

server.bind(20777)

const wss = new WebSocket.Server({
	port: 8080
})

wss.on("connection", ws => {
	console.log("client connected to websocket")
})

http.createServer((req, res) => {
	if (req.url == "/") {
		res.writeHead(200, {"Content-Type": "text/html"})
		res.write(fs.readFileSync("html/index.html"))
	} else if (req.url == "/script.js") {
		res.writeHead(200, {"Content-Type": "text/javascript"})
		res.write(fs.readFileSync("html/script.js"))
	} else {
		res.writeHead(404)
	}

	res.end()
}).listen(8000)
