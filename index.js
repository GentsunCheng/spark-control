const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

// 创建窗口方法
const createWindow = () => {
	// const menu = Menu.buildFromTemplate([]);
	// Menu.setApplicationMenu(menu);
	const win = new BrowserWindow({
		width: 500,
		height: 850,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false, // 允许在渲染进程中使用 require 和其他 Electron API
			preload: path.join(__dirname, "preload.js"), // 预加载脚本路径
        },
        icon: path.join(__dirname, 'assets/logo.ico'),
	});
	win.loadFile("index.html");
};

// 设置应用图标
const iconPath = path.join(__dirname, 'assets/logo.ico');
app.whenReady().then(() => {
	if (app.isReady() && app.dock) {
		app.dock.setIcon(iconPath);
	}
});

// 在 app 就绪后创建窗口
app.whenReady().then(() => {
	createWindow();
});

// 监听来自渲染进程的 SSH 命令执行请求
ipcMain.on("execute-ssh-command", (event, addr, command) => {
	exec(`ssh spark@"${addr}" "${command}"`, (error, stdout, stderr) => {
		console.log(`SSH status: ${stdout}`);
		event.reply("ssh-command-executed", { stdout });
	});
});
