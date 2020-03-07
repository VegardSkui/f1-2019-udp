let webSocket = new WebSocket("ws://127.0.0.1:8080")

let speedData = []
for (let i = 0; i < 500; i++) speedData.push(0)

let throttleData = []
for (let i = 0; i < 500; i++) throttleData.push(0)

let brakeData = []
for (let i = 0; i < 500; i++) brakeData.push(0)

let rpmData = []
for (let i = 0; i < 500; i++) rpmData.push(0)

let gearData = []
for (let i = 0; i < 500; i++) gearData.push(0)

webSocket.onmessage = event => {
    let data = JSON.parse(event.data)["m_carTelemetryData"][0]

    speedData.push(data["m_speed"])
    speedData.shift()
    updateSpeedChart()

    throttleData.push(data["m_throttle"])
    throttleData.shift()
    brakeData.push(data["m_brake"])
    brakeData.shift()
    updatePedalsChart()

    rpmData.push(data["m_engineRPM"])
    rpmData.shift()
    gearData.push(data["m_gear"])
    gearData.shift()
    updateRpmGearChart()

    document.getElementById("rev-light").style["width"] = data["m_revLightsPercent"] * 2 + "px"

    document.getElementById("drs-indicator").style["color"] = data["m_drs"] == 1 ? "green" : "lightgrey"
}

let speedChartCanvas = document.getElementById("speed-chart")
function updateSpeedChart() {
    let ctx = speedChartCanvas.getContext("2d")
    ctx.clearRect(0, 0, 500, 400)
    ctx.beginPath()
    ctx.moveTo(500, 400 - speedData[499])
    for (let i = 498; i >= 0; i--) ctx.lineTo(i, 400 - speedData[i])
    ctx.stroke()
}

let pedalsChartCanvas = document.getElementById("pedals-chart")
function updatePedalsChart() {
    let ctx = pedalsChartCanvas.getContext("2d")
    ctx.clearRect(0, 0, 500, 400)
    ctx.strokeStyle = "green"
    ctx.beginPath()
    ctx.moveTo(500, 400 - throttleData[499] * 400)
    for (let i = 498; i >= 0; i--) ctx.lineTo(i, 400 - throttleData[i] * 400)
    ctx.stroke()
    ctx.strokeStyle = "red"
    ctx.beginPath()
    ctx.moveTo(500, 400 - brakeData[499] * 400)
    for (let i = 498; i >= 0; i--) ctx.lineTo(i, 400 - brakeData[i] * 400)
    ctx.stroke()
}

let rpmGearChartCanvas = document.getElementById("rpm-gear-chart")
function updateRpmGearChart() {
    let ctx = rpmGearChartCanvas.getContext("2d")
    ctx.clearRect(0, 0, 500, 400)
    ctx.strokeStyle = "blue"
    ctx.beginPath()
    ctx.moveTo(500, 400 - rpmData[499] / 35)
    for (let i = 498; i >= 0; i--) ctx.lineTo(i, 400 - rpmData[i] / 35)
    ctx.stroke()
    ctx.strokeStyle = "brown"
    ctx.beginPath()
    ctx.moveTo(500, 400 - gearData[499] * 50)
    for (let i = 498; i >= 0; i--) ctx.lineTo(i, 400 - gearData[i] * 50)
    ctx.stroke()
}
