// 获取按钮元素
const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const grabButton = document.getElementById("grabButton");
const releaseButton = document.getElementById("releaseButton");
const brakeButton = document.getElementById("brakeButton");
const speedButton = document.getElementById("speedButton");

// Create
var messageBox = document.getElementById("messageBox");
// 初始化ROS
var ros = new ROSLIB.Ros({
	url: "ws://192.168.3.9:9090",
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
var publisher = new ROSLIB.Topic({
	ros: ros,
	name: "/grasp",
	messageType: "std_msgs/String",
});

// 底盘控制
var cmdVel = new ROSLIB.Topic({
	ros: ros,
	name: "/cmd_vel",
	messageType: "geometry_msgs/Twist",
});

var speed_mod = 1;
var step = 1;
var brakeActive = false;
var constat = "未就绪";
// 每隔一定时间执行一次循环体代码
var intervalId = setInterval(loopFunction, 100); // 间隔时间为 100 毫秒

// 按钮点击事件处理函数
function handleButtonClick(event) {
	buttonId = event.target.id;

	// 根据按钮的id执行相应操作
	switch (buttonId) {
		case "upButton":
			// 执行向上的操作
			sendMessage("w");
			break;
		case "downButton":
			// 执行向下的操作
			sendMessage("s");
			break;
		case "leftButton":
			// 执行向左的操作
			sendMessage("a");
			break;
		case "rightButton":
			// 执行向右的操作
			sendMessage("d");
			break;
		case "grabButton":
			// 执行抓取的操作
			sendMessage("g");
			break;
		case "releaseButton":
			// 执行放置的操作
			sendMessage("0");
			break;
		case "brakeButton":
			// 执行刹车的操作
			sendMessage("break");
			break;
		case "speedButton":
			// 执行速度切换的操作
			if (speed_mod == 1) {
				speed_mod = 0;
			} else {
				speed_mod = 1;
			}
			break;
		default:
			break;
	}
}

// 键盘按键事件处理函数
function handleKeyPress(event) {
	if (brakeActive) {
		key_in = event.key;
		if (key_in == "Space") return; // 刹车状态下不执行按键操作
		else {
			brakeActive = false;
		}
	}
	key = event.key;

	// 根据按键执行相应操作
	switch (key) {
		case "w":
			// 执行向上的操作
			simulateButtonClick(upButton);
			sendMessage("w");
			break;
		case "s":
			// 执行向下的操作
			simulateButtonClick(downButton);
			sendMessage("s");
			break;
		case "a":
			// 执行向左的操作
			simulateButtonClick(leftButton);
			sendMessage("a");
			break;
		case "d":
			// 执行向右的操作
			simulateButtonClick(rightButton);
			sendMessage("d");
			break;
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
		case "Space":
			// 执行刹车的操作
			simulateButtonClick(brakeButton);
			sendMessage("break");
			brakeActive = true; // 设置刹车状态为真
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
		// 第四关节调整
		case "ArrowLeft":
			sendMessage(41);
			break;
		case "ArrowRight":
			sendMessage(43);
			break;
		//备用状态
		case "Enter":
			sendMessage(200);
			break;
		//其他状态
		case "r":
			sendMessage(403);
			break;
		case "q":
			ros.close();
			constat = "已断开";
			break;
		default:
			break;
	}
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
		publisher.publish(message);
	}

	if (data == "break") {
		var twist = new ROSLIB.Message({
			linear: {
				x: 0,
				y: 0,
				z: 0,
			},
			angular: {
				x: 0,
				y: 0,
				z: 0,
			},
		});
		cmdVel.publish(twist);
	} else if (data != "break") {
		if (speed_mod) {
			var walk = 0.26;
			var yam = 1;
		} else {
			var walk = 0.04;
			var yam = 0.2;
		}
		switch (data) {
			case "w":
				var twist = new ROSLIB.Message({
					linear: {
						x: walk,
						y: 0,
						z: 0,
					},
					angular: {
						x: 0,
						y: 0,
						z: 0,
					},
				});
				break;
			case "s":
				var twist = new ROSLIB.Message({
					linear: {
						x: -walk,
						y: 0,
						z: 0,
					},
					angular: {
						x: 0,
						y: 0,
						z: 0,
					},
				});
				break;
			case "a":
				var twist = new ROSLIB.Message({
					linear: {
						x: 0,
						y: 0,
						z: 0,
					},
					angular: {
						x: 0,
						y: 0,
						z: yam,
					},
				});
				break;
			case "d":
				var twist = new ROSLIB.Message({
					linear: {
						x: 0,
						y: 0,
						z: 0,
					},
					angular: {
						x: 0,
						y: 0,
						z: -yam,
					},
				});
				break;
			default:
				break;
		}
		cmdVel.publish(twist);
	}
}

// 循环显示状态
function loopFunction() {
	let colorStyle;
	if (constat === "未就绪") {
		colorStyle = "color: blue;";
	} else if (constat === "已连接") {
		colorStyle = "color: green;";
	} else if (constat === "已断开") {
		colorStyle = "color: red;";
	} else {
		colorStyle = "";
	}

	// 更新 ROS 连接状态元素的内容和样式
	const rosStatusElement = document.getElementById("rosStatus");
	rosStatusElement.innerHTML = `ROS连接状态: <span style="${colorStyle}">${constat}</span>`;
	messageBox.innerHTML = "速度: " + speed_mod + "</br>" + "层数: " + step;
}

// 调用 loopFunction() 更新状态
loopFunction();

// 添加事件监听
upButton.addEventListener("click", handleButtonClick);
downButton.addEventListener("click", handleButtonClick);
leftButton.addEventListener("click", handleButtonClick);
rightButton.addEventListener("click", handleButtonClick);
grabButton.addEventListener("click", handleButtonClick);
releaseButton.addEventListener("click", handleButtonClick);
brakeButton.addEventListener("click", handleButtonClick);
speedButton.addEventListener("click", handleButtonClick);

// 添加键盘按键事件监听器
document.addEventListener("keydown", handleKeyPress);
