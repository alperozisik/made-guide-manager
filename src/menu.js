// menu.js
const { Menu, dialog } = require('electron');
const { fetchLinksFromDB, fetchAllPersonas, fetchAllTopics, fetchSuccessorList } = require('./db/database');
const { link } = require('fs');
const fs = require('fs').promises; // Promisified fs module

function createAppMenu(mainWindow) {
    const isMac = process.platform === 'darwin';

    const template = [
        // Application Menu (for macOS)
        ...(isMac ? [{
            label: 'Uygulama',
            submenu: [
                { role: 'about' }, // About menu is included by default for macOS
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),

        // File Menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Link',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('open-new-link-modal');
                        }
                    }
                },
                {
                    label: 'List Links',
                    accelerator: 'CmdOrCtrl+L',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('open-list-links-modal');
                        }
                    }
                },
                {
                    label: 'Export Data',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        exportData();
                    }
                },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },

        // Edit Menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },

        // View Menu
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },

        // Window Menu
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },

        // Help Menu
        {
            label: 'Help',
            submenu: [
                // Removed 'Learn More' menu
                // You can add other helper menu items here if you need them
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const exportData = async () => {
        try {
            // Show the Save File Dialog
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Export Data',
                defaultPath: 'guide.json',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ]
            });

            if (canceled || !filePath) {
                // User canceled the dialog
                return;
            }

            // Getting data from Renderer process
            const data = await Promise.all([
                fetchLinksFromDB(false),
                fetchAllTopics(),
                fetchAllPersonas(),
                fetchSuccessorList(),
            ]);

            const fileData = {
                links: data[0],
                topics: data[1],
                personas: data[2],
                successors: data[3],
            }

            // Convert data to formatted JSON
            const jsonData = JSON.stringify(fileData, null, 2);

            // Write data to file
            await fs.writeFile(filePath, jsonData, 'utf8');

            // Send success message
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Export Successful',
                message: 'Data has been successfully exported.',
                buttons: ['OK']
            });
        } catch (error) {
            console.error('Export Data Error:', error);
            dialog.showErrorBox('Export Failed', `An error occurred while exporting data: ${error.message}`);
        }
    };
};

module.exports = { createAppMenu };
