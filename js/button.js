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
var brakeActive = false;
var stat = "静止";
messageBox.innerHTML += "速度: " + speed_mod + "</br>" + "状态: " + stat;
// 每隔一定时间执行一次循环体代码
var intervalId = setInterval(loopFunction, 100); // 间隔时间为 100 毫秒

// 按钮点击事件处理函数
function handleButtonClick(event) {
	const buttonId = event.target.id;

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
			stat = "静止";
			break;
	}
}

// 键盘按键事件处理函数
function handleKeyPress(event) {
	if (brakeActive) {
		const key_in = event.key;
		if (key_in == " ") return; // 刹车状态下不执行按键操作
		else {
			brakeActive = false;
		}
	}
	const key = event.key;

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
		case " ":
			// 执行刹车的操作
			simulateButtonClick(brakeButton);
			sendMessage("break");
			brakeActive = true; // 设置刹车状态为真
			break;
		case ".":
			// 速度切换操作
			if (speed_mod == 1) {
				speed_mod = 0;
			} else {
				speed_mod = 1;
			}
			sendMessage("");
			break;
		default:
			stat = "静止";
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
	ros.on("connection", function () {
		console.log("Connected to websocket server.");
	});

	ros.on("error", function (error) {
		console.log("Error connecting to websocket server: ", error);
	});

	ros.on("close", function () {
		console.log("Connection to websocket server closed.");
	});

	if (data == "g") {
		const message = new ROSLIB.Message({
			data: "0",
		});
		publisher.publish(message);
		console.log("抓取");
		stat = "抓取";
	} else if (data == "0") {
		const message = new ROSLIB.Message({
			data: "10",
		});
		publisher.publish(message);
		console.log("放置");
		stat = "放置";
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
		stat = "刹车";
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
				stat = "前进";
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
				stat = "后退";
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
				stat = "左转";
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
				stat = "右转";
				break;
			default:
				break;
		}
		cmdVel.publish(twist);
	}
}

// 循环显示状态
function loopFunction() {
	messageBox.innerHTML = "";
	messageBox.innerHTML += "速度: " + speed_mod + "</br>" + "状态: " + stat;
}

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
