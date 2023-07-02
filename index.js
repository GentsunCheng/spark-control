const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

// 创建窗口方法
const createWindow = () => {
	const menu = Menu.buildFromTemplate([]);
	Menu.setApplicationMenu(menu);
	const win = new BrowserWindow({
		width: 400,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false, // 允许在渲染进程中使用 require 和其他 Electron API
			preload: path.join(__dirname, "preload.js"), // 预加载脚本路径
		},
	});
	win.loadFile("index.html");
};

// 设置应用图标
const iconPath = path.join(__dirname, "assets", "logo.ico");
app.whenReady().then(() => {
	if (app.isReady() && app.dock) {
		app.dock.setIcon(iconPath);
	}
});

// 在 app 就绪后创建窗口
app.whenReady().then(() => {
	createWindow();

	// 注册键盘事件
	const { webContents } = BrowserWindow.getAllWindows()[0];
	webContents.on("before-input-event", (event, input) => {
		if (input.control && input.key.toLowerCase() === "r") {
			// 执行 SSH 命令
			exec('ssh spark@192.168.3.9 "resetarm"', (error, stdout, stderr) => {
				if (error) {
					console.error(`执行 SSH 命令时出错: ${error.message}`);
					return;
				}
				if (stderr) {
					console.error(`SSH 命令的标准错误输出: ${stderr}`);
					return;
				}
				console.log(`SSH 命令的标准输出: ${stdout}`);
			});
		}
	});
});

// 监听来自渲染进程的 SSH 命令执行请求
ipcMain.on("execute-ssh-command", (event, command) => {
	exec(`ssh spark@192.168.3.9 "${command}"`, (error, stdout, stderr) => {
		if (error) {
			console.error(`执行 SSH 命令时出错: ${error.message}`);
			event.reply("ssh-command-executed", { error: error.message });
			return;
		}
		if (stderr) {
			console.error(`SSH 命令的标准错误输出: ${stderr}`);
			event.reply("ssh-command-executed", { error: stderr });
			return;
		}
		console.log(`SSH 命令的标准输出: ${stdout}`);
		event.reply("ssh-command-executed", { stdout });
	});
});
