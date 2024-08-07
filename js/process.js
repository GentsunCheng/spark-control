const net = require("net");

var messageBox = document.getElementById("messageBox");
var ipaddr = "";
var ros = null;
var publisher = null;
var cmdVel = null;
var walk_vel = 0.15;
var run_vel = 3.0;
var yaw_walk = 0.5;
var yaw_run = 1.5;
var yam = 0.0;
var run = 0.0;
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
	//获取图像画质
	imgquality = document.getElementById("imgquality").value;
	// 连接ros视频流
	document.getElementById('rosvideo').src = "http://" + ipaddr + ":5000/stream?topic=/camera/color/image_raw&amp&quality=" + imgquality;
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
	// 主要逻辑
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
			sendMessage("set_step");
			break;
		case "ArrowDown":
			if (step > 1) {
				step--;
			} else if (step <= 0) {
				step = 1;
			}
			sendMessage("set_step");
			break;
		case "1":
			step = 1;
			sendMessage("set_step");
			break;
		case "2":
			step = 2;
			sendMessage("set_step");
			break;
		case "3":
			step = 3;
			sendMessage("set_step");
			break;
		// 第四关节调整
		case "7":
			sendMessage("pump_left");
			break;
		case "9":
			sendMessage("pump_right");
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
        case "4":
            sendMessage("sweep_l");
            break;
		case "5":
			sendMessage("pump_up_down");
			if (pump_site == "上") pump_site = "下";
			else pump_site = "上";
            break;
        case "6":
            sendMessage("sweep_r");
            break;
		case "c":
		case "Enter":
			pump_site = "上";
			sendMessage("close_pump");
			break;
		case "g":
			step = 2;
			// 执行抓取的操作
			sendMessage("blue_square");
			break;
		case "h":
			step = 2;
			// 执行抓取的操作
			sendMessage("vegetable");
			break;
		case "f":
		case "0":
			pump_site = "上";
			// 执行放置的操作
			sendMessage("release");
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
		case "v":
		case "+":
			sendMessage("spare");
			break;
		//其他状态
		case "r":
			step = 0;
			angle1st = 90.0;
			sendMessage("return");
			break;
		case "Alt":
			sendMessage("reset");
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
	if (data == "blue_square") {
		const coordinates = {
			cmd: "grab",
            type: "blue_square"
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		publisher.publish(message);
	} else if (data == "vegetable") {
		const coordinates = {
			cmd: "grab",
            type: "vegetable"
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		publisher.publish(message);
	} else if (data == "release") {
		const message = new ROSLIB.Message({
			data: "release",
		});
		publisher.publish(message);
	} else if (data == "pump_up_down") {
		const message = new ROSLIB.Message({
			data: "pump_up_down",
		});
		publisher.publish(message);
	} else if (data === "set_step") {
		const coordinates = {
			cmd: "step",
            step: step
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		publisher.publish(message);
	} else if (data == "close_pump") {
		const message = new ROSLIB.Message({
			data: "close_pump",
		});
		publisher.publish(message);
	} else if (data == "pump_left") {
		const message = new ROSLIB.Message({
			data: "pump_left",
		});
		publisher.publish(message);
	} else if (data == "pump_right") {
		const message = new ROSLIB.Message({
			data: "pump_right",
		});
		publisher.publish(message);
	} else if (data == "spare") {
		const message = new ROSLIB.Message({
			data: "spare",
		});
		publisher.publish(message);
	} else if (data == "return") {
		const message = new ROSLIB.Message({
			data: "return",
		});
		angle1st = 90.0;
		publisher.publish(message);
	} else if (data === "reset") {
		const message = new ROSLIB.Message({
			data: "reset",
		});
		publisher.publish(message);
	} else if (data == "sweep_l") {
		const coordinates = {
			cmd: "sweep",
            dir: "left"
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		publisher.publish(message);
	} else if (data == "sweep_r") {
		const coordinates = {
			cmd: "sweep",
            dir: "right"
        };
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		publisher.publish(message);
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
	}
}

// 断开连接函数
function disconnect() {
	constat = "已断开";
}

// 循环显示状态
function loopEvent() {
	let ROScolor;
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

	// 更新 ROS 连接状态元素的内容和样式
	const rosStatusElement = document.getElementById("rosStatus");
	rosStatusElement.innerHTML = `ROS状态:<span style="${ROScolor}">${constat}</span>`;
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
            x: x / 1.5,
            y: y / 1.5
        };
		step = 2;
		const message = new ROSLIB.Message({
			data: JSON.stringify(coordinates),
		});
		console.log(message);
		publisher.publish(message);
    });
});

