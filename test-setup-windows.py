#!/usr/bin/env python3
"""
Test script per Windows per verificare il setup
"""
import requests
import time
import sys
import subprocess
import os

def check_docker():
    """Verifica che Docker sia installato e funzionante"""
    print("🐳 Checking Docker...")
    
    try:
        # Test docker command
        result = subprocess.run(['docker', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Docker installed:", result.stdout.strip())
        else:
            print("❌ Docker not found")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Docker not found or not responding")
        return False
    
    try:
        # Test docker compose
        result = subprocess.run(['docker', 'compose', 'version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Docker Compose available")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    try:
        # Test docker-compose (legacy)
        result = subprocess.run(['docker-compose', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Docker Compose (legacy) available")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("❌ Docker Compose not found")
    return False

def check_docker_desktop():
    """Verifica che Docker Desktop sia in esecuzione"""
    print("🖥️ Checking Docker Desktop...")
    
    try:
        result = subprocess.run(['docker', 'info'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Docker Desktop is running")
            return True
        else:
            print("❌ Docker Desktop not running")
            print("💡 Start Docker Desktop and try again")
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Docker Desktop not running")
        print("💡 Start Docker Desktop and try again")
        return False

def test_backend():
    """Test backend endpoints"""
    print("🧪 Testing backend...")
    
    base_url = "http://localhost:8000"
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/healthz", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("💡 Make sure Docker Desktop is running and services are started")
        print("💡 Try: start.bat up")
        return False
    
    # Test API docs
    try:
        response = requests.get(f"{base_url}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API docs accessible")
        else:
            print("❌ API docs not accessible")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot access API docs: {e}")
    
    # Test upload endpoint
    try:
        response = requests.post(f"{base_url}/api/v1/uploads", 
                              json={"client_upload_id": "test_123"})
        if response.status_code == 200:
            print("✅ Upload endpoint working")
        else:
            print(f"❌ Upload endpoint failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload endpoint error: {e}")
    
    return True

def test_minio():
    """Test MinIO console"""
    print("🧪 Testing MinIO...")
    
    try:
        response = requests.get("http://localhost:9001", timeout=5)
        if response.status_code == 200:
            print("✅ MinIO console accessible")
            return True
        else:
            print("❌ MinIO console not accessible")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to MinIO: {e}")
        return False

def test_paddleocr():
    """Test PaddleOCR service"""
    print("🧪 Testing PaddleOCR...")
    
    try:
        response = requests.get("http://localhost:8866/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("ocr_ready"):
                print("✅ PaddleOCR service ready")
                return True
            else:
                print("⚠️ PaddleOCR service running but OCR not ready")
                return True
        else:
            print("❌ PaddleOCR service not responding")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to PaddleOCR: {e}")
        return False

def check_ports():
    """Verifica che le porte siano libere"""
    print("🔌 Checking ports...")
    
    ports = [8000, 9000, 9001, 5432, 6379, 8866]
    occupied_ports = []
    
    for port in ports:
        try:
            result = subprocess.run(['netstat', '-an'], 
                                  capture_output=True, text=True, timeout=5)
            if f":{port}" in result.stdout:
                occupied_ports.append(port)
        except:
            pass
    
    if occupied_ports:
        print(f"⚠️ Ports in use: {occupied_ports}")
        print("💡 You may need to stop other services or change ports")
    else:
        print("✅ All ports are free")
    
    return len(occupied_ports) == 0

def main():
    """Run all tests"""
    print("🚀 Testing 'È un'offerta?' setup on Windows...")
    print("=" * 60)
    
    # Check prerequisites
    tests = [
        ("Docker Installation", check_docker),
        ("Docker Desktop", check_docker_desktop),
        ("Ports", check_ports),
        ("Backend API", test_backend),
        ("MinIO Console", test_minio),
        ("PaddleOCR Service", test_paddleocr),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n{name}:")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} test failed with exception: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 All tests passed! Your setup is working correctly.")
        print("\n📱 Next steps:")
        print("  1. Install mobile dependencies: start.bat mobile-install")
        print("  2. Build mobile app: start.bat mobile-build")
        print("  3. Open API docs: http://localhost:8000/docs")
        print("  4. Open MinIO console: http://localhost:9001")
    else:
        print("⚠️ Some tests failed. Check the logs above.")
        print("\n🔧 Troubleshooting:")
        print("  1. Make sure Docker Desktop is running")
        print("  2. Start services: start.bat up")
        print("  3. Check logs: start.bat logs")
        print("  4. Restart services: start.bat down && start.bat up")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
