import os
import sys

def list_files_with_contents(folder_path, output_file='output29.txt'):
    with open(output_file, 'w', encoding='utf-8') as out_file:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                out_file.write(f"{file_path}\n")
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    out_file.write(content + "\n\n")
                except Exception as e:
                    out_file.write(f"[Error reading file: {e}]\n\n")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python list_files.py <folder_path>")
        sys.exit(1)

    folder_path = sys.argv[1]

    if not os.path.isdir(folder_path):
        print(f"Error: '{folder_path}' is not a valid directory.")
        sys.exit(1)

    list_files_with_contents(folder_path)
    print(f"Done. File list with contents written to 'output29.txt'")

