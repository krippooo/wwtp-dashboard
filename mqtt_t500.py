from pymodbus.client.sync import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian
from paho.mqtt import client as mqtt
import json
import time

# Setup koneksi Modbus TCP
modbus = ModbusTcpClient('192.168.100.1', port=502) # IP address modbus server/master

# Setup koneksi MQTT
try:
    # For newer paho-mqtt versions (2.0+)
    mqttc = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id="rpi02_modbus_publisher")
except (AttributeError, TypeError):
    # For older paho-mqtt versions
    mqttc = mqtt.Client("rpi02_modbus_publisher")

mqttc.connect("192.168.100.8", 1883)  # IP PC pada jaringan

# Fungsi decode float32
def read_float32(address):
    """
    Membaca float32 dari 2 register berurutan
    address: starting register address (0-based atau 1-based tergantung konfigurasi)
    """
    res = modbus.read_holding_registers(address, 2, unit=1)
    if res.isError():
        print(f"Error reading register {address}: {res}")
        return None
    
    decoder = BinaryPayloadDecoder.fromRegisters(
        res.registers,
        byteorder=Endian.Little,  # 3412 Endian.Little
        wordorder=Endian.Big      # 3412 Endian.Big
    )
    return decoder.decode_32bit_float()

# Test koneksi Modbus
if not modbus.connect():
    print("Failed to connect to Modbus server")
    exit(1)

print("Connected to Modbus server")

# Loop utama
while True:
    try:

        # 1-based indexing
        cod  = read_float32(9)   # register 9
        tss  = read_float32(11)   # register 11, diperoleh dari konfigurasi yang diberikan vendor.

        # Debug: print raw values
        print(f"Raw values - COD: {cod}, TSS: {tss}")

        # Pesan yang dipublish ke database
        payload = {
            "cod": round(cod, 2) if cod is not None else None,
            "tss": round(tss, 2) if tss is not None else None,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
        }

        # Publish ke MQTT
        result = mqttc.publish("wwtp/t500/data", json.dumps(payload))
        if result.rc == 0:
            print("Published:", payload)
        else:
            print("Failed to publish MQTT message")

    except Exception as e:
        print("Error:", e)

    time.sleep(60) # Berdasarkan alat yang dipasang ambil datanya setiap menit satu kali

# Cleanup
modbus.close()