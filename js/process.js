const net = require("net");

var messageBox = document.getElementById("messageBox");
var ipaddr = "";
var ros = null;
var socket = new net.Socket();
var publisher = null;
var cmdVel = null;
var walk_vel = 0.15;
var run_vel = 3.0;
var yaw_walk = 0.5;
var yaw_run = 1.5;
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
var pump_site = "上";
var constat = "未就绪";
var wscs = "未就绪";
let clickCoordinates = { x: 0, y: 0 };
// 每隔一定时间执行一次循环体代码
var intervalId = setInterval(loopEvent, 100); // 间隔时间为 100 毫秒
// 更新全局变量的函数
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        updateGlobalVariable();
        document.getElementById('inputField').blur();
    }
}
function updateGlobalVariable() {
	// 获取输入框的值
	var input = document.getElementById("inputField");
	// 将输入的值赋给全局变量
	ipaddr = input.value;
	// 连接ros视频流
	document.getElementById('rosvideo').src = "http://" + ipaddr + ":5000/stream?topic=/camera/color/image_raw&amp";
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
			sendMessage(50 + step);
			break;
		case "ArrowDown":
			if (step > 1) {
				step--;
			} else if (step <= 0) {
				step = 1;
			}
			sendMessage(50 + step);
			break;
		case "ArrowLeft":
			if (angle1st < 130) angle1st++;
			socket.write("angle1st+" + angle1st);
			break;
		case "ArrowRight":
			if (angle1st > 50) angle1st--;
			socket.write("angle1st+" + angle1st);
			break;
		case "1":
			step = 1;
			sendMessage(50 + step);
			break;
		case "2":
			step = 2;
			sendMessage(50 + step);
			break;
		case "3":
			step = 3;
			sendMessage(50 + step);
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
		run = 0.0;
		yam = 0.0;
		keyState.space = false;
	}
	checkMultipleKeys();

	switch (keyup) {
		case ".":
			step = 0;
			sendMessage("666");
            break;
        case "4":
            sendMessage(114);
            break;
		case "5":
			sendMessage(55);
			if (pump_site == "上") pump_site = "下";
			else pump_site = "上";
            break;
        case "6":
            sendMessage(514);
            break;
		case "c":
			pump_site = "上";
			sendMessage(58);
			break;
		case "g":
			step = 2;
			// 执行抓取的操作
			sendMessage("g");
			break;
		case "h":
			step = 2;
			// 执行抓取的操作
			sendMessage("v");
			break;
		case "f":
			pump_site = "上";
			// 执行放置的操作
			sendMessage("0");
			break;
		case "Shift":
			// 速度切换操作
			if (speed_mod == 1) {
				speed_mod = 0;
			} else {
				speed_mod = 1;
			}
			break;
		//备用状态
		case "+":
			sendMessage(200);
			break;
		//其他状态
		case "r":
			step = 0;
			angle1st = 90.0;
			sendMessage(403);
			break;
		case "Alt":
			step = 0;
			angle1st = 90.0;
			socket.write("reset");
            break;
        case "`":
            socket.write("noise");
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

// 发送消息到 ROS WebSocket
function sendMessage(data) {
	if (data == "g") {
		const message = new ROSLIB.Message({
			data: "0",
		});
		publisher.publish(message);
		console.log("键盘抓取");
	} else if (data == "666") {
		const message = new ROSLIB.Message({
			data: "666",
		});
		publisher.publish(message);
		console.log("666");
	} else if (data == "ga") {
		const message = new ROSLIB.Message({
			data: "0a",
		});
		publisher.publish(message);
		console.log("按键抓取");
	} else if (data == "v") {
		const message = new ROSLIB.Message({
			data: "0v",
		});
		publisher.publish(message);
		console.log("按键抓取");
	} else if (data == "0") {
		const message = new ROSLIB.Message({
			data: "1",
		});
		publisher.publish(message);
		console.log("放置");
	} else if (data == 51) {
		const message = new ROSLIB.Message({
			data: "51",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 52) {
		const message = new ROSLIB.Message({
			data: "52",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 53) {
		const message = new ROSLIB.Message({
			data: "53",
		});
		publisher.publish(message);
		console.log("层数调整");
	} else if (data == 55) {
		const message = new ROSLIB.Message({
			data: "55",
		});
		publisher.publish(message);
		console.log("方块层数");
	} else if (data == 58) {
		const message = new ROSLIB.Message({
			data: "58",
		});
		publisher.publish(message);
		console.log("关闭气泵");
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
	} else if (data == 114) {
		const message = new ROSLIB.Message({
			data: "1141",
		});
		publisher.publish(message);
		console.log("114");
	} else if (data == 514) {
		const message = new ROSLIB.Message({
			data: "5141",
		});
		publisher.publish(message);
		console.log("514");
	} else if (data == "run") {
		if (speed_mod) {
			run_data = run * run_vel;
			yam_data = yam * yaw_run;
		} else {
			run_data = run * walk_vel;
			yam_data = yam * yaw_walk;
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
		console.log(run_data + " " + yam_data);
	}
}

// 断开连接函数
function disconnect() {
	constat = "已断开";
	wscs = "已断开";
	socket.write("exit");
	ros.close();
	socket.close();
}

// 循环显示状态
function loopEvent() {
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
	rosStatusElement.innerHTML = `ROS状态:<span style="${ROScolor}">${constat}</span>`;
	armStatusElement.innerHTML = `ARM状态:<span style="${ARMcolor}">${wscs}</span>`;
	messageBox.innerHTML =
		"<span style='font-weight: bold;'>速度: " +
		speed_mod +
		"</br>" +
		"层数: " +
		step +
		"</br>" +
		"气泵: " +
		pump_site +
		"</span>";
}

// 调用 loopFunction() 更新状态
loopEvent();

// 添加事件监听器
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("DOMContentLoaded", function() {
    // 获取图片元素
    const clickboxElement = document.getElementById("click_box");

    // 添加点击事件监听器
    clickboxElement.addEventListener("click", function(event) {
        // 获取点击位置的坐标
        const rect = clickboxElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

		const coordinates = {
			cmd: "catch",
            x: x,
            y: y
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		console.log(message);
		publisher.publish(message);
    });
});

