#!/bin/bash

# Configuration
INPUT_DIR="${1:-.}"
OUTPUT_DIR="./optimized"

# Find Node.js executable
if command -v node &> /dev/null; then
    NODE_EXEC="node"
elif [ -x "/usr/local/bin/node" ]; then
    NODE_EXEC="/usr/local/bin/node"
elif [ -x "/opt/homebrew/bin/node" ]; then
    NODE_EXEC="/opt/homebrew/bin/node"
else
    echo "Error: Could not find 'node' executable in PATH or common locations."
    echo "Please install Node.js or add it to your PATH."
    exit 1
fi

# Determine Squoosh command
# Prefer local script invoked directly by node to avoid shebang 'env' issues
LOCAL_CLI="./node_modules/@squoosh/cli/src/index.js"

if [ -f "$LOCAL_CLI" ]; then
    # We use arguments for the node script
    # --no-warnings suppresses MaxListenersExceededWarning noise
    SQUOOSH_CMD="$NODE_EXEC --no-warnings $LOCAL_CLI"
elif command -v npx &> /dev/null; then
    SQUOOSH_CMD="npx @squoosh/cli"
else
    echo "Error: Could not find local squoosh-cli script at $LOCAL_CLI and npx is not available."
    echo "Please ensure you have run 'npm install'."
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Looking for images in: $INPUT_DIR"
echo "Outputting to: $OUTPUT_DIR"

# Find and process images
find "$INPUT_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r img; do
    # Skip images already in output directory to avoid infinite loops if output is subdir of input
    if [[ "$img" == *"$OUTPUT_DIR"* ]]; then
        continue
    fi

    echo "Processing $img..."

    # Extract path components
    dir_path=$(dirname "$img")
    parent_folder=$(basename "$dir_path")
    filename=$(basename "$img")
    filename_no_ext="${filename%.*}"

    # Normalize to kebab-case (lowercase, replace spaces/underscores with hyphens)
    # Using tr for simple translation
    kebab_parent=$(echo "$parent_folder" | tr '[:upper:]' '[:lower:]' | tr ' _' '--')
    kebab_name=$(echo "$filename_no_ext" | tr '[:upper:]' '[:lower:]' | tr ' _' '--')
    
    # Construct new filename
    # If parent is current dir (.), just use filename? Or just ignore dot?
    # User said "renaming each image with the subfolder name".
    if [ "$parent_folder" == "." ] || [ "$dir_path" == "." ]; then
         final_name="${kebab_name}"
    else
         final_name="${kebab_parent}-${kebab_name}"
    fi

    # Run Squoosh
    # --resize '{"width":1000}'
    # --mozjpeg auto
    
    # Note: providing both resize and codec options.
    # We output to a temp location or directly to output, but we need to verify the output filename.
    # Squoosh CLI writes to <output_dir>/<filename>.<ext>
    # Since we are sequentially processing, we can let it write there, then move/rename it immediately.
    
    # Run Squoosh and capture stderr to check for errors
    squoosh_output=$($SQUOOSH_CMD --resize '{"width":1000}' --oxipng '{"level":4}' --output-dir "$OUTPUT_DIR" "$img" 2>&1)
    squoosh_exit_code=$?

    if [ $squoosh_exit_code -ne 0 ]; then
        echo "Error: Failed to process $img (unsupported format or corrupt file). Skipping..."
        echo "-----------------------------------"
        continue
    fi

    # Show Squoosh output on success
    echo "$squoosh_output"

    # Resulting file will have .jpg extension because of --mozjpeg
    # Original filename might be .png, so we need to check both possible original extension preservation or change.
    # With --mozjpeg, it definitely forces .jpg (or .jpeg).
    
    # Identify the generated file
    # Squoosh usually keeps the basename and changes extension if codec changes.
    generated_file="$OUTPUT_DIR/${filename_no_ext}.png"
    
    # If the source was already jpg, it might be just .jpg. 
    # If strictly overwriting, we need to be careful. But we output to separate dir.
    
    if [ -f "$generated_file" ]; then
        target_file="$OUTPUT_DIR/${final_name}.png"
        mv "$generated_file" "$target_file"
        echo "Saved as: $target_file"
    else
        # Fallback check if it didn't add extension or kept original (unlikely with --mozjpeg)
        echo "Warning: Could not locate expected output file $generated_file"
    fi

    echo "-----------------------------------"
done

echo "Done! Check $OUTPUT_DIR for optimized images."
