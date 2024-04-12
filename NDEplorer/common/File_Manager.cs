using Microsoft.AspNetCore.Mvc;

namespace NDExplorer.common
{
    public class File_Manager
    {
        protected string _rootPath;
        protected string _command;
        protected string _value;
        // Dùng trong trường hợp đổi tên , di chuyển file.
        protected string _secondaryValue;
        protected IFormFile _file;
        public File_Manager(string rootPath, HttpRequest request)
        {
            _rootPath = rootPath;
            _command = request.Query["cmd"].ToString();
            _value = request.Query["value"].ToString();
            _secondaryValue = request.Query["secondaryValue"].ToString();
            if (request.Method.ToUpper() == "POST")
            {
                _file = request.Form.Files["FILE_UPLOAD"];
            }
        }

        public FileManagerResponse ExecuteCmd()
        {
            FileManagerResponse response = new();
            try
            {
                switch (_command)
                {
                    case "GET_ALL_DIR":
                        {
                            response.Data = GetAllDirs();
                            break;
                        }

                    // Lấy file trong thư mục khác
                    case "GET_ALL_IN_DIR":
                        {
                            response.Data = GetAllIndir(_value);
                            break;
                        }

                    case "DELETE_ITEM":
                        {
                            DeleteItem(_value);
                            break;
                        }

                    case "ADD_NEW_FOLDER":
                        {
                            AddNewFolder(_value);
                            break;
                        }

                    case "UPLOAD":
                        {
                            UploadFile(_value);
                            break;
                        }
                    case "RENAME_ITEM":
                        {
                            RenameItem(_value,_secondaryValue);
                            break;
                        }
                    default:
                        break;
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.Data = null;
            }

            return response;
        }

        /*đóng code nhưng bị lỗi "lỏ"*/
        /*#region code*/

        protected List<FMFolderItem> GetAllIndir(string folder)
        {
            var result = new List<FMFolderItem>();
            var fullPath = Path.Combine(_rootPath, folder);
            var dirs = Directory.GetDirectories(fullPath)
                    .Select(d => new FMFolderItem
                    {
                        Path = d.Replace(_rootPath + "\\", ""),
                        Name = Path.GetFileName(d), // Lấy tên thư mục 
                        IsFolder = true
                    });

            var files = Directory.GetFiles(fullPath)
                   .Select(f => new FMFolderItem
                   {
                       Path = f.Replace(_rootPath + "\\", ""),
                       Name = Path.GetFileName(f),
                       IsFolder = false
                   });

            result.AddRange(dirs);
            result.AddRange(files);

            return result;
        }

        protected List<string> GetAllDirs()
        {
            var dirs = Directory.GetDirectories(_rootPath, "*", SearchOption.AllDirectories).ToList();
            for (int i = 0; i < dirs.Count; i++)
            {
                dirs[i] = dirs[i].Replace(_rootPath, string.Empty).Trim(Path.DirectorySeparatorChar); // Ký tự phân cách thư mục 'Lấy dấu đường dẫn tùy vào HĐH'
            }

            // Sắp xếp bằng hàm sort tự định nghĩa, ưu tiên ký tự "\"
            dirs.Sort((string a, string b) =>
            {
                for (int i = 0; i < a.Length; i++)
                {
                    if (i >= b.Length) return 1;
                    if (a[i] != b[i])
                    {
                        if (a[i] == '\\') return -1;
                        if (b[i] == '\\') return 1;
                        return a[i] - b[i];
                    }
                }
                return a.Length - b.Length;
            });


            return dirs;
        }
        protected void DeleteItem(string path)
        {
            path = Path.Combine(_rootPath, path);
            if (File.Exists(path))
            {
                File.Delete(path);
            }
            else if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }

        protected void AddNewFolder(string name)
        {
            name = Path.Combine(_rootPath, name);
            if (Directory.Exists(name))
            {
                throw new Exception("Tên thư mục đã tồn tại!");
            }
            else
            {
                Directory.CreateDirectory(name);
            }
        }

        //Rename file:
        protected void RenameItem(string oldPath, string newPath)
        {

            oldPath = Path.Combine(_rootPath, oldPath);
            newPath = Path.Combine(_rootPath, newPath);
            if(Directory.Exists(oldPath))
            {
                if(Directory.Exists(newPath) == false)
                {
                    Directory.Move(oldPath, newPath);
                }
                else
                {
                    throw new Exception("Tên thư mục không tồn tại!");
                }

            }else if (File.Exists(oldPath))
			{
				if (File.Exists(newPath) == false)
				{
					File.Move(oldPath, newPath);
				}
				else
				{
					throw new Exception("Tên tệp đã tồn tại!");
				}
			}
		}

        protected void UploadFile(string folder)
        {
            if (_file is null)
            {
                throw new Exception("Không có file!");
            }

            // Tạo tên file mới,gắn thêm thời gian để không bị trùng
            var filename = Path.GetFileNameWithoutExtension(_file.FileName)
                        + DateTime.Now.Ticks
                        + Path.GetExtension(_file.FileName);
            var path = Path.Combine(_rootPath, folder, filename);
            var stream = new FileStream(path, FileMode.CreateNew);
            _file.CopyTo(stream);

            stream.Close();
            stream.Dispose();

        }
    }




    public class FileManagerResponse
    {
        public bool Success { get; set; } = true;
        public string? Message { get; set; }
        public object? Data { get; set; }
    }

    public class FMFolderItem
    {
        public string Path { get; set; }
        public string Name { get; set; }
        public bool IsFolder { get; set; }
    }
}
