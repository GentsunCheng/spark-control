const { app, BrowserWindow } = require("electron");
const path = require("path");

// 创建窗口方法
const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 1000,
	});
	win.loadFile("index.html");
};

// 设置应用图标
const iconPath = path.join(__dirname, "assets", "icon.png");
app.whenReady().then(() => {
	app.dock.setIcon(iconPath);
});

// 在 app 就绪后创建窗口
app.whenReady().then(() => {
	createWindow();
});

// 其他应用程序生命周期事件和代码...
