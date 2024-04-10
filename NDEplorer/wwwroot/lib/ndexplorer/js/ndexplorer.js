document.addEventListener('alpine:init', () => {
    Alpine.data('ndexplorer', () => ({
        _setting: {
            baseUrl: '/ndexplorer',
            ajaxParam: {
                cmd: '',
                value: '',
                secondaryValue: ''
            },

            setParams(cmd, value = '', secondaryValue = '') {
                this.ajaxParam.cmd = cmd;
                this.ajaxParam.value = value;
                this.ajaxParam.secondaryValue = secondaryValue;

            },

            getUrl() {
                return `${this.baseUrl}?${new URLSearchParams(this.ajaxParam)}`;
            }
        },

        _folderTree: [
            {
                fullPath: '',
                level: 1,
                folderName: '',
                isOpen: true,
                cssClass: {}
            }
        ],

        _folderTreeSelecedIndex: -1,
        _panelItemSelectedIndex: -1,
        _additionalInfo: {
            selectedText: '',
        },

        _folderUpdinPopup: {
            show: false,
            label: 'Tên thư mục',
            value: '',
            isRenameMode: false,

        },

        _panelData: [
            {
                path: '',
                name: '',
                isFolder: false
            }
        ],

        init() {
            this._setting.setParams("GET_ALL_DIR");
            fetch(this._setting.getUrl())
                .then(res => res.json())
                .then(json => {
                    this._folderTree = json.data.map(path => {
                        // tách chuỗi thành mảng dựa theo dấu \
                        var tmpArr = path.split("\\");
                        return {
                            folderName: tmpArr[tmpArr.length - 1], // phần tử cuối
                            fullPath: path,
                            level: tmpArr.length,
                            isOpen: false,
                            cssClass: {
                                [`folder-level-${tmpArr.length}`]: true,
                                show: false
                            }
                        }
                    });
                });
        },

        toggleFolder(idx) {
            /* this.$el.innerText = '-';*/

            // Hiển thị những thư mực có level lớn hơn level hiện tại 1 đơn vị
            if (idx >= this._folderTree.length) {
                return;
            }

            this._folderTree[idx].isOpen = !this._folderTree[idx].isOpen;
            var currentLevel = this._folderTree[idx].level;
            this.openFolder(idx, currentLevel);

            /*      hiển thị thư mục con 
 
             var currentLevel = this._folderTree[idx].level;
             var isOpen = this._folderTree[idx].isOpen;
             this.$el.innerText = isOpen ? '-' : '+';
 
 
             while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > currentLevel) {
                 if (this._folderTree[idx + 1].level == currentLevel + 1) {
                     this._folderTree[idx + 1].cssClass.show = isOpen;
                 }
                 idx++;*/
        },
        openFolder(idx, maxLevel) {
            var isOpen = this._folderTree[idx].isOpen;

            if (isOpen) {
                // Mở thư mục
                while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > maxLevel) {
                    if (maxLevel + 1 == this._folderTree[idx + 1].level) {
                        this._folderTree[idx + 1].cssClass.show = true;
                        if (this._folderTree[idx + 1].isOpen) {
                            // Đệ quy
                            this.openFolder(idx + 1, this._folderTree[idx + 1].level);
                        }
                    }
                    idx++;
                }
            } else {
                // Đóng thư mục
                while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > maxLevel) {
                    this._folderTree[idx + 1].cssClass.show = false;
                    idx++;
                }
            }
        },

        GetAllIndir(fullPath, idx) {
            this._panelItemSelectedIndex = -1;
            this._folderTreeSelecedIndex = idx;
            this._setting.setParams("GET_ALL_IN_DIR", fullPath);
            fetch(this._setting.getUrl())
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        this._panelData = json.data;
                    }
                });
        },

        getIcon(isFolder) {
            let icon = 'file-solid.svg';
            if (isFolder) {
                icon = 'file-solid.svg';
            }
            return '/lib/ndexplorer/icon/' + icon;
        },

        setSelectedItem(f, idx) {

            this._panelItemSelectedIndex = idx;
            this._additionalInfo.selectedText = this._panelData[idx].name;
        },

        deleteSelectedItem() {
            let idx = this._panelItemSelectedIndex;
            if (idx < 0 || !this._panelData[idx]) {
                alert("chưa chọn file hoặc thư mục!");
                return;
            }


            this._setting.setParams("DELETE_ITEM", this._panelData[idx].path);
            fetch(this._setting.getUrl())
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        let isFolder = this._panelData[idx].isFolder;
                        let fullPath = this._panelData[idx].path;
                        // Xóa Item được chọn ra khỏi panelData
                        this._panelData.splice(idx, 1);

                        // Xóa khỏi cây thư mục nêu là folder
                        if (isFolder) {
                            // Tìm lại index trên cây thư mục

                            let startIdx = this._folderTree.findIndex(item => item.fullPath == fullPath);
                            idx = startIdx;
                            if (idx >= 0) {
                                let level = this._folderTree[idx].level;
                                let cntDel = 1;
                                while (idx + 1 < this._folderTree.length && this._folderTree[idx + 1].level > level) // folderTree của thg tiếp theo lớn hơn thg hiện tại thì nó sẽ cộng lên
                                {
                                    cntDel++;  // Đếm xem bao nhiêu thg bị xóa
                                    idx++;
                                }
                                this._folderTree.splice(startIdx, cntDel);
                            }
                        }
                        this._panelItemSelectedIndex = -1;
                    }
                });
        },

        openFolderUpdinPopup() {
            // Hiện thị popup và đặt giá trị mặc định
            this._folderUpdinPopup.show = true;
            this._folderUpdinPopup.value = 'NewFolder';
            this._folderUpdinPopup.label = 'Tên thư mục';
            this._folderUpdinPopup.isRenameMode = false;

        },
        closeFolderUpdinPopup() {
            this._folderUpdinPopup.show = false;
        },
        updinFolder() {
            if (this._folderUpdinPopup.isRenameMode) {
                // Mode Rename

            }
            else {
                // Mode Create
                let i = this._folderTreeSelecedIndex;
                let newFolderName = this._folderUpdinPopup.value;

                if (!newFolderName) {
                    alert("chưa nhập tên thư mục");
                    return;
                }

                let newFolderPath = this._folderTree[i].fullPath + "\\" + newFolderName;

                this._setting.setParams("ADD_NEW_FOLDER", newFolderPath);
                fetch(this._setting.getUrl())
                    .then(res => res.json())
                    .then(json => {
                        if (json.success) {
                            var panelItem = {
                                path: newFolderPath,
                                name: newFolderName,
                                isFolder: true
                            };
                            this._panelData.unshift(panelItem);   // lưu được dl mảng bất kỳ

                            // Thêm vào cây thu mục
                            var folderTreeItem = {
                                fullPath: newFolderPath,
                                level: this._folderTree[i].level + 1,
                                folderName: newFolderName,
                                isOpen: false,
                                cssClass: {
                                    [`folder-level-${this._folderTree[i].level + 1}`]: true,
                                    show: this._folderTree[i].isOpen
                                }
                            };
                            this._folderTree.splice(i + 1, 0, folderTreeItem);

                            // Gọi hàm đóng popup sau khi hoàn tất
                            this.closeFolderUpdinPopup();
                        }
                        else {
                            alert(json.message);
                        }
                    });
            }
        },


        renameSelectedItem() {
            let i = this._panelItemSelectedIndex;
            if (!this._panelData[i]) {
                alert("chưa chọn file hoặc thư mục!");
                return;
            }
            this._folderUpdinPopup.show = true;
            this._folderUpdinPopup.value = this._panelData[i].name;
            if (this._panelData[i].isFolder) {
                this._folderUpdinPopup.label = 'Tên thư mục';
            }
            else {
                this._folderUpdinPopup.label = 'Tên File';
            }
            this._folderUpdinPopup.isRenameMode = true;
        },

        uploadFile() {

            let fileuploadEle = this.$el.parentElement.querySelector("input[fm-file-upload]");

            if (fileuploadEle.files.length == 0) {
                alert("Bạn chưa Chọn file!");
                return;
            }

            let file = fileuploadEle = files[0];
            let data = new FormData();
            data.append("FILE_UPLOAD", file, file.name);

            let i = this._folderTreeSelecedIndex;
            this._setting.setParams("UPLOAD", this._folderTree[i].fullPath);
            fetch(this._setting.getUrl(), {
                mothod: 'POST',
                body: data,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                    }
            })
                .then(res => location.reload());
        }

    }));
});