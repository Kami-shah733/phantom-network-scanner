import nmap

nm = nmap.PortScanner()

target = "127.0.0.1"

nm.scan(hosts=target, arguments='-sT -p 1-100')

for host in nm.all_hosts():
    print(f"\nHost: {host}")
    
    for proto in nm[host].all_protocols():
        print(f"Protocol: {proto}")
        
        for port in nm[host][proto].keys():
            state = nm[host][proto][port]['state']
            print(f"Port {port}: {state}")