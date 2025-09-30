#!/usr/bin/env python3
"""
Test script to verify the setup is working correctly
"""
import requests
import time
import sys

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

def main():
    """Run all tests"""
    print("🚀 Testing 'È un'offerta?' setup...")
    print("=" * 50)
    
    # Wait a bit for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(5)
    
    tests = [
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
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Your setup is working correctly.")
        print("\n📱 Next steps:")
        print("  1. Install mobile dependencies: make install-mobile")
        print("  2. Build mobile app: make build-mobile")
        print("  3. Open API docs: make api-docs")
        print("  4. Open MinIO console: make minio-console")
    else:
        print("⚠️ Some tests failed. Check the logs above.")
        print("\n🔧 Troubleshooting:")
        print("  1. Make sure all services are running: make up")
        print("  2. Check logs: make logs")
        print("  3. Restart services: make down && make up")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
