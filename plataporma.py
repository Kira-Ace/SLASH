import platform

def platform_operations():
    print("--- Platform Module Operations ---")
    
    os_name = platform.system()
    print(f"Operating System: {os_name}")
    
    os_release = platform.release()
    print(f"OS Release Version: {os_release}")
    
    machine_type = platform.machine()
    print(f"Machine Type: {machine_type}")
    
    python_version = platform.python_version()
    print(f"Python Version: {python_version}")

if __name__ == "__main__":
    platform_operations()