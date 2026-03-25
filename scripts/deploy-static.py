#!/usr/bin/env python3

import os
import json
import subprocess
import sys
import hashlib
from pathlib import Path

APP_ID = "dkcmgnfwojthr"
BRANCH_NAME = "main"
REGION = "ap-northeast-1"
OUT_DIR = "out"

def get_file_md5(file_path):
    """Calculate MD5 hash of a file"""
    md5 = hashlib.md5()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            md5.update(chunk)
    return md5.hexdigest()

def create_file_map():
    """Create file map with MD5 hashes for Amplify deployment"""
    file_map = {}
    file_list = []

    for root, dirs, files in os.walk(OUT_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            # Remove 'out/' prefix for the key
            key = file_path[len(OUT_DIR)+1:]
            # Calculate MD5 hash of the file
            md5_hash = get_file_md5(file_path)
            file_map[key] = md5_hash
            file_list.append((file_path, key))

    return file_map, file_list

def create_deployment(file_map):
    """Create deployment and get upload URLs"""
    try:
        cmd = [
            "aws", "amplify", "create-deployment",
            "--app-id", APP_ID,
            "--branch-name", BRANCH_NAME,
            "--cli-input-json",
            json.dumps({"appId": APP_ID, "branchName": BRANCH_NAME, "fileMap": file_map}),
            "--region", REGION
        ]

        print("🚀 Creating Amplify deployment...")
        print(f"📁 Files to upload: {len(file_map)}")

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            response = json.loads(result.stdout)
            job_id = response.get("jobId")
            upload_urls = response.get("fileUploadUrls", {})
            print(f"✅ Deployment created: {job_id}")
            print(f"📤 Upload URLs generated for {len(upload_urls)} files")
            return job_id, upload_urls
        else:
            print(f"❌ Error: {result.stderr}")
            return None, None

    except Exception as e:
        print(f"❌ Exception: {e}")
        return None, None

def upload_files_to_urls(file_list, upload_urls):
    """Upload files to the provided URLs"""
    success_count = 0

    for file_path, file_key in file_list:
        if file_key not in upload_urls:
            print(f"⚠️  No upload URL for {file_key}")
            continue

        url = upload_urls[file_key]

        try:
            with open(file_path, 'rb') as f:
                file_content = f.read()

            # Upload using curl or Python requests
            cmd = [
                "curl", "-X", "PUT", "-H", "Content-Type: application/octet-stream",
                "--data-binary", f"@{file_path}", url
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                success_count += 1
                print(f"✓ {file_key}")
            else:
                print(f"✗ {file_key}: {result.stderr}")

        except Exception as e:
            print(f"✗ {file_key}: {e}")

    return success_count

def start_deployment(job_id):
    """Start the deployment"""
    try:
        cmd = [
            "aws", "amplify", "start-deployment",
            "--app-id", APP_ID,
            "--branch-name", BRANCH_NAME,
            "--job-id", job_id,
            "--region", REGION
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✅ Deployment started: {job_id}")
            return True
        else:
            print(f"❌ Error starting deployment: {result.stderr}")
            return False

    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("📦 Amplify Static Hosting Deployment")
    print("=" * 60)

    if not os.path.exists(OUT_DIR):
        print(f"❌ Output directory '{OUT_DIR}' not found")
        sys.exit(1)

    file_map, file_list = create_file_map()

    if not file_map:
        print(f"❌ No files found in '{OUT_DIR}'")
        sys.exit(1)

    print(f"📋 File map created with {len(file_map)} files")
    print()

    # Step 1: Create deployment
    job_id, upload_urls = create_deployment(file_map)
    if not job_id:
        sys.exit(1)

    print()

    # Step 2: Upload files
    print("📤 Uploading files...")
    success_count = upload_files_to_urls(file_list, upload_urls)
    print(f"✅ {success_count}/{len(file_list)} files uploaded")
    print()

    # Step 3: Start deployment
    if start_deployment(job_id):
        print("\n" + "=" * 60)
        print("✅ Deployment started successfully!")
        print("=" * 60)
        print(f"\n📱 App URL: https://{APP_ID}.amplifyapp.com")
        print(f"⏳ Deployment will be live in a few moments...")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
