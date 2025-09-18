#!/bin/bash

# Script to extract web_secrets.7z using a password provided as a command line argument

# Check if password is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <password>"
    exit 1
fi

PASSWORD=$1
ARCHIVE="web_secrets.7z"

# Check if the archive file exists
if [ ! -f "$ARCHIVE" ]; then
    echo "Error: $ARCHIVE not found in the current directory."
    exit 1
fi

# Extract the archive with the provided password
echo "Extracting $ARCHIVE..."
7z x -p"$PASSWORD" "$ARCHIVE"

# Check if extraction was successful
if [ $? -eq 0 ]; then
    echo "Extraction completed successfully. Moving config.ts to app directory."
    mv config.ts ../src/firebase/config.ts
else
    echo "Error: Extraction failed. Please check the password or archive integrity."
    exit 1
fi