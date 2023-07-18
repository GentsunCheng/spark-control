const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// 创建窗口方法
const createWindow = () => {
	const menu = Menu.buildFromTemplate([]);
	Menu.setApplicationMenu(menu);
	const win = new BrowserWindow({
		width: 1400,
        height: 800,
        blur: true,
		webPreferences: {
			webviewTag: true,
			nodeIntegration: true,
			contextIsolation: false, // 允许在渲染进程中使用 require 和其他 Electron API
			preload: path.join(__dirname, "preload.js"), // 预加载脚本路径
		},
		icon: path.join(__dirname, "assets/logo.ico"),
	});
	win.loadFile("index.html");
    win.setOpacity(0.95);
    win.show();
};

// 设置应用图标
const iconPath = path.join(__dirname, "assets/logo.ico");
app.whenReady().then(() => {
	if (app.isReady() && app.dock) {
		app.dock.setIcon(iconPath);
	}
});

// 在 app 就绪后创建窗口
app.whenReady().then(() => {
	createWindow();
});
