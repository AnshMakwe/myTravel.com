import os

def append_multiple_files(output_path="output33.txt", path_file="paths.txt"):
    try:
        # Check if paths.txt exists
        if not os.path.exists(path_file):
            print(f"Error: '{path_file}' not found.")
            return
        
        # Read all file paths from paths.txt
        with open(path_file, "r") as pf:
            file_paths = [line.strip() for line in pf.readlines()]  # Remove extra spaces/newlines

        # Process each file path
        for input_path in file_paths:
            if not os.path.exists(input_path):  # Skip if file doesn't exist
                print(f"Warning: '{input_path}' not found, skipping.")
                continue

            file_name = os.path.basename(input_path)  # Extract filename
            
            # Print the file path being read
            print(f"Reading from: {input_path}")

            # Append content to output.txt
            with open(input_path, "r") as infile, open(output_path, "a") as outfile:
                outfile.write(f"\nThe file '{file_name}' (Path: {input_path}) contains:\n\n")  # Append heading
                outfile.write(infile.read() + "\n")  # Append file content with newline

            print(f"Content from '{file_name}' appended to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    append_multiple_files()

