// 获取按钮元素
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const grabButton = document.getElementById("grabButton");
const releaseButton = document.getElementById("releaseButton");
const brakeButton = document.getElementById("brakeButton");
const speedButton = document.getElementById("speedButton");
const defaultButton = document.getElementById("defaultButton");
const resetButton = document.getElementById("resetButton");
const arrowUp = document.getElementById("arrowUp");
const arrowDown = document.getElementById("arrowDown");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");

const net = require("net");

var vnciframe = document.getElementById("vnciframe");
var messageBox = document.getElementById("messageBox");
var ipaddr = "";
var ros = null;
var socket = new net.Socket();
var publisher = null;
var cmdVel = null;
var walk_vel = 0.2;
var run_vel = 1.3;
var yaw_rate = 0.2;
var yaw_rate_run = 1.0;
var yam = 0.0;
var run = 0.0;
var angle1st = 90.0;
var keyState = {
	w: false,
	s: false,
	a: false,
	d: false,
	space: false,
};
var speed_mod = 1;
var step = 1;
var constat = "未就绪";
var wscs = "未就绪";
// 每隔一定时间执行一次循环体代码
var intervalId = setInterval(loopShow, 100); // 间隔时间为 100 毫秒
// 更新全局变量的函数
function vncvalue() {
	// 获取 iframe 元素
	var iframe = document.querySelector(".embedded-page");
	// 获取输入框的值
	input = document.getElementById("inputField");
	// 将输入的值赋给全局变量
	ipaddr = input.value;
	// 设置 src 属性值为输入的 IP 地址
	iframe.src = "http://" + ipaddr + ":8080/guacamole";
	// 打印远程桌面地址
	console.log("VNC Addr：" + iframe.src);
}
function updateGlobalVariable() {
	// 获取输入框的值
	var input = document.getElementById("inputField");
	// 将输入的值赋给全局变量
	ipaddr = input.value;
	// 打印ROS
	console.log("IP Addr：" + ipaddr);
	// 初始化ROS
	ros = new ROSLIB.Ros({
		url: "ws://" + ipaddr + ":9090",
	});
	ros.on("connection", function () {
		console.log("Connected to websocket server.");
		constat = "已连接";
	});
	ros.on("error", function (error) {
		console.log("Error connecting to websocket server: ", error);
		constat = "连接错误";
	});
	ros.on("close", function () {
		console.log("Connection to websocket server closed.");
		constat = "已断开";
	});
	// 抓取和释放
	publisher = new ROSLIB.Topic({
		ros: ros,
		name: "/grasp",
		messageType: "std_msgs/String",
	});
	// 底盘控制
	cmdVel = new ROSLIB.Topic({
		ros: ros,
		name: "/cmd_vel",
		messageType: "geometry_msgs/Twist",
	});

	// ARM初始化
	socket.connect(8801, ipaddr, function () {
		console.log("Connected to server");
		socket.write("verify");
	});
	// 接收服务端发送的数据
	socket.on("data", function (data) {
		console.log("Received: " + data);
		if (data.toString() === "OK") {
			wscs = "已连接";
		}
	});
	// 处理错误事件
	socket.on("error", function (err) {
		console.log("Error: " + err.message);
		wscs = "连接错误";
	});
}

// 按钮点击事件处理函数
function handleButtonClick(event) {
	buttonId = event.target.id;

	// 根据按钮的id执行相应操作
	switch (buttonId) {
		case "upButton":
			// 执行向上的操作
			run = 1.0;
			sendMessage("run");
			break;
		case "downButton":
			// 执行向下的操作
			run = -1.0;
			sendMessage("run");
			break;
		case "leftButton":
			// 执行向左的操作
			yam = 1.0;
			sendMessage("run");
			break;
		case "rightButton":
			// 执行向右的操作
			yam = -1.0;
			sendMessage("run");
			break;
		case "brakeButton":
			// 执行刹车的操作
			run = 0.0;
			yam = 0.0;
			sendMessage("run");
			break;
		case "grabButton":
			// 执行抓取的操作
			sendMessage("g");
			break;
		case "releaseButton":
			// 执行放置的操作
			sendMessage("0");
			break;
		case "speedButton":
			// 执行速度切换的操作
			if (speed_mod == 1) {
				speed_mod = 0;
			} else {
				speed_mod = 1;
			}
			break;
		case "defaultButton":
			sendMessage(403);
			break;
		case "resetButton":
			socket.write("reset");
			break;
		case "arrowUp":
			// 执行向上的操作
			if (step < 3) {
				step++;
			}
			sendMessage(10 + step);
			break;
		case "arrowDown":
			// 执行向下的操作
			if (step > 1) {
				step--;
			}
			sendMessage(10 + step);
			break;
		case "arrowLeft":
			if (angle1st < 180) angle1st++;
			socket.write("angle1st+" + angle1st);
			break;
		case "arrowRight":
			if (angle1st > 0) angle1st--;
			socket.write("angle1st+" + angle1st);
			break;
		default:
			break;
	}
}

function handleKeyDown(event) {
	var keydown = event.key;

	if (keydown == "w") {
		keyState.w = true;
	}
	if (keydown == "s") {
		keyState.s = true;
	}
	if (keydown == "a") {
		keyState.a = true;
	}
	if (keydown == "d") {
		keyState.d = true;
	}
	if (keydown == " ") {
		keyState.space = true;
	}
	checkMultipleKeys();

	switch (keydown) {
		// 层数调整
		case "ArrowUp":
			if (step < 3) {
				step++;
			}
			sendMessage(10 + step);
			break;
		case "ArrowDown":
			if (step > 1) {
				step--;
			}
			sendMessage(10 + step);
			break;
		case "ArrowLeft":
			if (angle1st < 180) angle1st++;
			socket.write("angle1st+" + angle1st);
			break;
		case "ArrowRight":
			if (angle1st > 0) angle1st--;
			socket.write("angle1st+" + angle1st);
			break;
		// 第四关节调整
		case "7":
			sendMessage(41);
			break;
		case "9":
			sendMessage(43);
			break;
		default:
			break;
	}
}

function handleKeyUp(event) {
	var keyup = event.key;

	if (keyup == "w") {
		run = 0.0;
		keyState.w = false;
	}
	if (keyup == "s") {
		run = 0.0;
		keyState.s = false;
	}
	if (keyup == "a") {
		yam = 0.0;
		keyState.a = false;
	}
	if (keyup == "d") {
		yam = 0.0;
		keyState.d = false;
	}
	if (keyup == " ") {
		keyState.space = false;
	}
	checkMultipleKeys();

	switch (keyup) {
		case "g":
			// 执行抓取的操作
			simulateButtonClick(grabButton);
			sendMessage("g");
			break;
		case "0":
			// 执行放置的操作
			simulateButtonClick(releaseButton);
			sendMessage("0");
			break;
		case "Shift":
			// 速度切换操作
			if (speed_mod == 1) {
				speed_mod = 0;
			} else {
				speed_mod = 1;
			}
			sendMessage("");
			break;
		//备用状态
		case "Enter":
			sendMessage(200);
			break;
		//其他状态
		case "r":
			sendMessage(403);
			break;
		case "Alt":
			socket.write("reset");
			break;
		case "q":
			disconnect();
			break;
		default:
			break;
	}
}

function checkMultipleKeys() {
	if (keyState.w) {
		run = 1.0;
	}
	if (keyState.s) {
		run = -1.0;
	}
	if (keyState.a) {
		if (keyState.w) {
			yam = 1.0;
		} else if (keyState.s) {
			yam = -1.0;
		} else {
			yam = 1.0;
		}
	}
	if (keyState.d) {
		if (keyState.w) {
			yam = -1.0;
		} else if (keyState.s) {
			yam = 1.0;
		} else {
			yam = -1.0;
		}
	}
	if (keyState.space) {
		run = 0.0;
		yam = 0.0;
	}
	sendMessage("run");
}

// 模拟按钮点击效果
function simulateButtonClick(button) {
	const icon = button.querySelector(".icon");
	icon.classList.add("pressed");
	setTimeout(() => {
		icon.classList.remove("pressed");
	}, 100);
}

// 发送消息到 ROS WebSocket
function sendMessage(data) {
	if (data == "g") {
		const message = new ROSLIB.Message({
			data: "0",
		});
		publisher.publish(message);
		console.log("抓取");
	} else if (data == "0") {
		const message = new ROSLIB.Message({
			data: "10",
		});
		publisher.publish(message);
		console.log("放置");
	} else if (data == 11) {
		const message = new ROSLIB.Message({
			data: "11",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 12) {
		const message = new ROSLIB.Message({
			data: "12",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 13) {
		const message = new ROSLIB.Message({
			data: "13",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 41) {
		const message = new ROSLIB.Message({
			data: "41",
		});
		publisher.publish(message);
		console.log("第四关节左");
	} else if (data == 43) {
		const message = new ROSLIB.Message({
			data: "43",
		});
		publisher.publish(message);
		console.log("第四关节右");
	} else if (data == 200) {
		const message = new ROSLIB.Message({
			data: "200",
		});
		publisher.publish(message);
		console.log("备用状态抓");
	} else if (data == 403) {
		const message = new ROSLIB.Message({
			data: "403",
		});
		angle1st = 90.0;
		publisher.publish(message);
		console.log("默认位姿");
	} else if (data == "run") {
		if (speed_mod) {
			run_data = run * run_vel;
			yam_data = yam * yaw_rate_run;
		} else {
			run_data = run * walk_vel;
			yam_data = yam * yaw_rate;
		}
		var twist = new ROSLIB.Message({
			linear: {
				x: run_data,
				y: 0,
				z: 0,
			},
			angular: {
				x: 0,
				y: 0,
				z: yam_data,
			},
		});
		cmdVel.publish(twist);
		console.log("移动状态");
	}
}

// 断开连接函数
function disconnect() {
	ros.close();
	constat = "已断开";
	wscs = "已断开";
	socket.write("exit");
	iframe.src = "about:blank";
}

// 循环显示状态
function loopShow() {
	let ROScolor, ARMcolor;
	if (constat === "未就绪") {
		ROScolor = "color: blue;";
	} else if (constat === "已连接") {
		ROScolor = "color: green;";
	} else if (constat === "已断开") {
		ROScolor = "color: orange;";
	} else if (constat === "连接错误") {
		ROScolor = "color: red;";
	} else {
		ROScolor = "";
	}
	if (wscs === "未就绪") {
		ARMcolor = "color: blue;";
	} else if (wscs === "已连接") {
		ARMcolor = "color: green;";
	} else if (wscs === "已断开") {
		ARMcolor = "color: orange;";
	} else if (wscs === "连接错误") {
		ARMcolor = "color: red;";
	} else {
		ARMcolor = "";
	}

	// 更新 ROS 连接状态元素的内容和样式
	const rosStatusElement = document.getElementById("rosStatus");
	const armStatusElement = document.getElementById("armStatus");
	rosStatusElement.innerHTML = `ROS连接状态: <span style="${ROScolor}">${constat}</span>`;
	armStatusElement.innerHTML = `ARM连接状态: <span style="${ARMcolor}">${wscs}</span>`;
	messageBox.innerHTML = "速度: " + speed_mod + "</br>" + "层数: " + step;
}

// 调用 loopFunction() 更新状态
loopShow();

// 添加事件监听
// 点击事件
speedButton.addEventListener("click", handleButtonClick);
defaultButton.addEventListener("click", handleButtonClick);
resetButton.addEventListener("click", handleButtonClick);
grabButton.addEventListener("click", handleButtonClick);
releaseButton.addEventListener("click", handleButtonClick);

// mousedown事件
upButton.addEventListener("mousedown", handleButtonClick);
downButton.addEventListener("mousedown", handleButtonClick);
leftButton.addEventListener("mousedown", handleButtonClick);
rightButton.addEventListener("mousedown", handleButtonClick);
brakeButton.addEventListener("mousedown", handleButtonClick);
arrowUp.addEventListener("mousedown", handleButtonClick);
arrowDown.addEventListener("mousedown", handleButtonClick);
arrowLeft.addEventListener("mousedown", handleButtonClick);
arrowRight.addEventListener("mousedown", handleButtonClick);

// 添加键盘按键事件监听器
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

// 监听鼠标移入事件
vnciframe.addEventListener("mouseenter", function () {
	// 设置 iframe 元素获取焦点
	vnciframe.contentWindow.focus();
});
// 监听鼠标移出事件
vnciframe.addEventListener("mouseleave", function () {
	// 设置 iframe 元素失去焦点
	vnciframe.contentWindow.blur();
});
