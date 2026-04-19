import { db, closeDatabase } from "./connection.js";
import {
    regions,
    regionCountries,
    shippingOptions,
    paymentProviders,
    salesChannels,
    categories,
    brands,
    products,
    productVariants,
} from "./schema/index.js";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

type SeedCountry = {
    iso2: string;
    name: string;
};

function getAllCountriesForSeed(): SeedCountry[] {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    const excludedCodes = new Set(["EU", "EZ", "UN", "XA", "XB", "XK", "ZZ", "CP", "DG", "EA", "IC", "TA"]);
    const seen = new Set<string>();
    const countries: SeedCountry[] = [];

    for (let first = 65; first <= 90; first++) {
        for (let second = 65; second <= 90; second++) {
            const code = String.fromCharCode(first) + String.fromCharCode(second);
            if (excludedCodes.has(code)) continue;

            const name = displayNames.of(code);

            // Intl returns the code itself for unknown regions.
            if (!name || name.toUpperCase() === code) continue;

            const iso2 = code.toLowerCase();
            if (seen.has(iso2)) continue;

            seen.add(iso2);
            countries.push({ iso2, name });
        }
    }

    countries.sort((a, b) => a.name.localeCompare(b.name));
    return countries;
}

const ELECTRONICS: { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] }[] = [
    { title: 'Arduino Uno Rev3', handle: 'arduino-uno-rev3', sku: 'ARD-UNO-R3', price: 5500, rrp: 6500, stock: 80, imgUrl: 'https://loremflickr.com/600/600/arduino,microcontroller', desc: 'The classic Arduino Uno based on ATmega328P with 14 digital I/O pins.', tags: ["arduino", "microcontroller"] },
    { title: 'Arduino Mega 2560', handle: 'arduino-mega-2560', sku: 'ARD-MEGA-2560', price: 9900, rrp: 11500, stock: 45, imgUrl: 'https://loremflickr.com/600/600/arduino,mega', desc: 'Arduino Mega 2560 with 54 digital I/O pins and 16 analog inputs.', tags: ["arduino", "microcontroller"] },
    { title: 'Arduino Nano V3.0', handle: 'arduino-nano-v3', sku: 'ARD-NANO-V3', price: 3200, rrp: 4000, stock: 120, imgUrl: 'https://loremflickr.com/600/600/arduino,nano', desc: 'Compact Arduino Nano V3 for breadboard prototyping.', tags: ["arduino", "nano"] },
    { title: 'Arduino Pro Mini 5V', handle: 'arduino-pro-mini-5v', sku: 'ARD-PROMIN-5V', price: 2800, rrp: 3500, stock: 100, imgUrl: 'https://loremflickr.com/600/600/arduino,mini', desc: 'Minimalist Arduino Pro Mini running at 5V/16MHz.', tags: ["arduino", "mini"] },
    { title: 'Arduino Leonardo', handle: 'arduino-leonardo', sku: 'ARD-LEO', price: 7800, rrp: 9000, stock: 30, imgUrl: 'https://loremflickr.com/600/600/arduino,usb', desc: 'Arduino Leonardo with built-in USB communication.', tags: ["arduino", "usb"] },
    { title: 'ESP32 DevKit V1', handle: 'esp32-devkit-v1', sku: 'ESP32-DVK-V1', price: 4200, rrp: 5000, stock: 100, imgUrl: 'https://loremflickr.com/600/600/esp32,wifi,module', desc: 'Dual-core 240MHz ESP32 with WiFi and Bluetooth built-in.', tags: ["esp32", "wifi"] },
    { title: 'ESP32-S3 Development Board', handle: 'esp32-s3-board', sku: 'ESP32S3-DEV', price: 5500, rrp: 6500, stock: 60, imgUrl: 'https://loremflickr.com/600/600/esp32,development,board', desc: 'ESP32-S3 with AI acceleration, USB OTG and rich peripherals.', tags: ["esp32-s3", "ai"] },
    { title: 'ESP8266 NodeMCU V3', handle: 'esp8266-nodemcu-v3', sku: 'ESP8266-NCMV3', price: 2800, rrp: 3500, stock: 90, imgUrl: 'https://loremflickr.com/600/600/esp8266,nodemcu,wifi', desc: 'Low-cost WiFi MCU with Lua scripting support.', tags: ["esp8266", "wifi"] },
    { title: 'ESP32-CAM AI-Thinker', handle: 'esp32-cam-ai', sku: 'ESP32CAM-AI', price: 7900, rrp: 9500, stock: 35, imgUrl: 'https://loremflickr.com/600/600/esp32,camera,module', desc: 'ESP32-CAM with OV2640 camera module for IoT vision projects.', tags: ["esp32", "camera"] },
    { title: 'ESP32 LoRa OLED Board', handle: 'esp32-lora-oled', sku: 'ESP32-LORA', price: 14900, rrp: 17500, stock: 20, imgUrl: 'https://loremflickr.com/600/600/lora,wireless,module', desc: 'ESP32 with LoRa SX1276 and 0.96 OLED display for long range IoT.', tags: ["esp32", "lora"] },
    { title: 'Raspberry Pi 4 Model B 4GB', handle: 'rpi4-4gb', sku: 'RPI4-4GB', price: 32000, rrp: 38000, stock: 25, imgUrl: 'https://loremflickr.com/600/600/raspberry-pi,singleboard,computer', desc: 'Raspberry Pi 4 with 4GB RAM, dual 4K HDMI, USB 3.0.', tags: ["raspberry-pi", "sbc"] },
    { title: 'Raspberry Pi 3 Model B+', handle: 'rpi3-bplus', sku: 'RPI3-BPLUS', price: 22000, rrp: 26000, stock: 20, imgUrl: 'https://loremflickr.com/600/600/raspberry-pi,linux,board', desc: 'Raspberry Pi 3B+ with 1.4GHz quad-core and dual-band WiFi.', tags: ["raspberry-pi"] },
    { title: 'Raspberry Pi Pico', handle: 'rpi-pico', sku: 'RPI-PICO', price: 2500, rrp: 3200, stock: 150, imgUrl: 'https://loremflickr.com/600/600/raspberry-pi,pico,microcontroller', desc: 'RP2040 microcontroller board - MicroPython and C/C++ support.', tags: ["pico", "microcontroller"] },
    { title: 'Raspberry Pi Pico W', handle: 'rpi-pico-w', sku: 'RPI-PICOW', price: 3800, rrp: 4500, stock: 100, imgUrl: 'https://loremflickr.com/600/600/raspberry-pi,pico,wifi', desc: 'Raspberry Pi Pico W with onboard WiFi 802.11n.', tags: ["pico", "wifi"] },
    { title: 'Raspberry Pi Zero 2 W', handle: 'rpi-zero-2w', sku: 'RPI-Z2W', price: 9500, rrp: 11500, stock: 30, imgUrl: 'https://loremflickr.com/600/600/raspberry-pi,zero,compact', desc: 'Ultra-compact Pi Zero 2 W with quad-core ARM and WiFi.', tags: ["raspberry-pi", "compact"] },
    { title: 'OLED Display 0.96 inch I2C', handle: 'oled-096-i2c', sku: 'OLED-096-I2C', price: 1800, rrp: 2200, stock: 150, imgUrl: 'https://loremflickr.com/600/600/oled,display,screen', desc: 'Monochromatic 0.96 inch OLED with I2C interface, 128x64 pixels.', tags: ["oled", "display"] },
    { title: 'OLED Display 1.3 inch I2C Blue', handle: 'oled-13-i2c-blue', sku: 'OLED-13-BLU', price: 2800, rrp: 3400, stock: 80, imgUrl: 'https://loremflickr.com/600/600/oled,blue,display', desc: '1.3 inch blue OLED display, 128x64, I2C interface.', tags: ["oled", "display"] },
    { title: 'LCD 16x2 Blue Backlight', handle: 'lcd-16x2-blue', sku: 'LCD-16X2-BLU', price: 1400, rrp: 1800, stock: 200, imgUrl: 'https://loremflickr.com/600/600/lcd,display,screen', desc: 'Standard 16 character by 2 line LCD with blue backlight.', tags: ["lcd", "display"] },
    { title: 'LCD 20x4 Blue Backlight I2C', handle: 'lcd-20x4-i2c', sku: 'LCD-20X4-I2C', price: 2500, rrp: 3000, stock: 60, imgUrl: 'https://loremflickr.com/600/600/lcd,i2c,screen', desc: '4-line 20-character LCD display with I2C backpack.', tags: ["lcd", "display"] },
    { title: 'TFT LCD 2.4 inch SPI 240x320', handle: 'tft-24-spi', sku: 'TFT-24SPI', price: 5500, rrp: 6500, stock: 50, imgUrl: 'https://loremflickr.com/600/600/tft,touchscreen,display', desc: '2.4 inch colour TFT LCD display with touchscreen and SPI interface.', tags: ["tft", "display"] },
    { title: 'Bluetooth Module HC-05', handle: 'bt-hc05', sku: 'BT-HC05', price: 2500, rrp: 3000, stock: 100, imgUrl: 'https://loremflickr.com/600/600/bluetooth,module,wireless', desc: 'HC-05 Bluetooth 2.0 serial pass-through module.', tags: ["bluetooth", "wireless"] },
    { title: 'Bluetooth Module HC-06 Slave', handle: 'bt-hc06', sku: 'BT-HC06', price: 2200, rrp: 2800, stock: 80, imgUrl: 'https://loremflickr.com/600/600/bluetooth,serial,module', desc: 'HC-06 Bluetooth slave module for Arduino serial communication.', tags: ["bluetooth", "wireless"] },
    { title: 'RFID Reader RC522 Kit', handle: 'rfid-rc522', sku: 'RFID-RC522', price: 1900, rrp: 2400, stock: 130, imgUrl: 'https://loremflickr.com/600/600/rfid,reader,nfc', desc: 'MFRC522 RFID reader/writer module with S50 card and key fob.', tags: ["rfid", "nfc"] },
    { title: 'GSM Module SIM800L', handle: 'gsm-sim800l', sku: 'GSM-SIM800L', price: 5500, rrp: 6500, stock: 40, imgUrl: 'https://loremflickr.com/600/600/gsm,sim,module', desc: 'SIM800L quad-band GSM/GPRS module for SMS and GPRS connectivity.', tags: ["gsm", "iot"] },
    { title: 'LoRa Module Ra-02 433MHz', handle: 'lora-ra02-433', sku: 'LORA-RA02', price: 3800, rrp: 4500, stock: 50, imgUrl: 'https://loremflickr.com/600/600/lora,radio,module', desc: 'SX1278 based LoRa Ra-02 433MHz long-range wireless module.', tags: ["lora", "wireless"] },
    { title: 'Relay Module 4-Channel 5V', handle: 'relay-4ch-5v', sku: 'RELAY-4CH', price: 2500, rrp: 3200, stock: 100, imgUrl: 'https://loremflickr.com/600/600/relay,module,electronics', desc: 'Optocoupler isolated 4-channel relay module, 5V, 250V AC.', tags: ["relay", "power"] },
    { title: 'Relay Module 2-Channel 5V', handle: 'relay-2ch-5v', sku: 'RELAY-2CH', price: 1500, rrp: 1900, stock: 150, imgUrl: 'https://loremflickr.com/600/600/relay,channel,module', desc: '2-channel relay module with optocoupler isolation.', tags: ["relay", "power"] },
    { title: 'TP4056 Lithium Charger Module', handle: 'tp4056-charger', sku: 'TP4056', price: 800, rrp: 1000, stock: 300, imgUrl: 'https://loremflickr.com/600/600/battery,charger,module', desc: 'TP4056 1A Li-Ion/LiPo battery charger with over-discharge protection.', tags: ["charger", "battery"] },
    { title: 'DC-DC Step-Down LM2596', handle: 'buck-lm2596', sku: 'BUCK-LM2596', price: 1800, rrp: 2200, stock: 100, imgUrl: 'https://loremflickr.com/600/600/dc,converter,power', desc: 'LM2596 adjustable step-down DC-DC converter 1.25V-35V 3A.', tags: ["power", "buck"] },
    { title: 'DC-DC Boost Converter MT3608', handle: 'boost-mt3608', sku: 'BOOST-MT3608', price: 1500, rrp: 1900, stock: 90, imgUrl: 'https://loremflickr.com/600/600/boost,converter,electronics', desc: 'MT3608 step-up 2A boost converter module, adjustable output.', tags: ["power", "boost"] },
    { title: 'Breadboard 830 Points Full-Size', handle: 'breadboard-830', sku: 'BB-830', price: 1500, rrp: 2000, stock: 200, imgUrl: 'https://loremflickr.com/600/600/breadboard,prototyping,electronics', desc: 'Full-size 830 tie-point solderless breadboard for circuit prototyping.', tags: ["breadboard", "prototyping"] },
    { title: 'Breadboard 400 Points Half-Size', handle: 'breadboard-400', sku: 'BB-400', price: 900, rrp: 1200, stock: 250, imgUrl: 'https://loremflickr.com/600/600/breadboard,half,electronics', desc: 'Half-size 400 tie-point solderless breadboard.', tags: ["breadboard", "prototyping"] },
    { title: 'Jumper Wire Set M-M 65pcs', handle: 'jumpers-mm-65', sku: 'JW-MM-65', price: 1200, rrp: 1600, stock: 500, imgUrl: 'https://loremflickr.com/600/600/jumper,wire,electronics', desc: '65-piece male-to-male jumper wire set for breadboard connections.', tags: ["jumper", "wires"] },
    { title: 'Jumper Wire Set M-F 40pcs', handle: 'jumpers-mf-40', sku: 'JW-MF-40', price: 900, rrp: 1200, stock: 400, imgUrl: 'https://loremflickr.com/600/600/jumper,cable,prototype', desc: '40-piece male-to-female jumper wires for module connections.', tags: ["jumper", "wires"] },
    { title: 'Logic Level Converter 5V-3.3V', handle: 'logic-shifter-5v-33', sku: 'LLC-5V-33V', price: 1200, rrp: 1500, stock: 100, imgUrl: 'https://loremflickr.com/600/600/logic,level,shifter', desc: 'Bidirectional logic level shifter 4-channel, 5V to 3.3V.', tags: ["logic", "level-shifter"] },
    { title: 'Servo Motor SG90 Micro 9G', handle: 'servo-sg90', sku: 'SERVO-SG90', price: 1100, rrp: 1400, stock: 200, imgUrl: 'https://loremflickr.com/600/600/servo,motor,robotics', desc: 'SG90 micro servo motor, 180 degree rotation, 1.6 kg-cm torque.', tags: ["servo", "motor"] },
    { title: 'Servo Motor MG996R Metal Gear', handle: 'servo-mg996r', sku: 'SERVO-MG996R', price: 3500, rrp: 4200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/servo,metal,motor', desc: 'MG996R high torque metal gear servo, 9.4 kg-cm.', tags: ["servo", "motor"] },
    { title: 'DC Motor Driver L298N', handle: 'driver-l298n', sku: 'DRV-L298N', price: 2000, rrp: 2500, stock: 120, imgUrl: 'https://loremflickr.com/600/600/motor,driver,l298', desc: 'Dual H-bridge L298N motor driver for 2 DC motors or 1 stepper.', tags: ["motor", "driver"] },
    { title: 'Stepper Motor 28BYJ-48 plus ULN2003', handle: 'stepper-28byj48', sku: 'STEP-28BYJ48', price: 2800, rrp: 3500, stock: 90, imgUrl: 'https://loremflickr.com/600/600/stepper,motor,module', desc: '28BYJ-48 5V unipolar stepper motor with ULN2003 driver board.', tags: ["stepper", "motor"] },
    { title: 'DC Motor TT 3-6V with Wheels', handle: 'tt-motor-wheel', sku: 'TT-MOT-WHEEL', price: 1500, rrp: 1900, stock: 120, imgUrl: 'https://loremflickr.com/600/600/dc,motor,wheel', desc: 'TT gear motor 3-6V with rubber wheel, ideal for robot cars.', tags: ["dc-motor", "robotics"] },
    { title: 'I2C EEPROM AT24C256', handle: 'eeprom-at24c256', sku: 'EEPROM-AT24C256', price: 500, rrp: 700, stock: 300, imgUrl: 'https://loremflickr.com/600/600/eeprom,memory,chip', desc: 'AT24C256 256Kbit I2C EEPROM memory module.', tags: ["eeprom", "memory"] },
    { title: 'Real Time Clock DS3231 Module', handle: 'rtc-ds3231', sku: 'RTC-DS3231', price: 2200, rrp: 2800, stock: 80, imgUrl: 'https://loremflickr.com/600/600/rtc,clock,module', desc: 'Extremely accurate DS3231 RTC module with battery backup.', tags: ["rtc", "clock"] },
    { title: 'NRF24L01 2.4GHz Radio Module', handle: 'nrf24l01-24ghz', sku: 'NRF24L01', price: 1600, rrp: 2000, stock: 100, imgUrl: 'https://loremflickr.com/600/600/nrf24,radio,wireless', desc: '2.4GHz low-power wireless transceiver NRF24L01+ with SPI.', tags: ["nrf24", "wireless"] },
    { title: 'SD Card Module SPI', handle: 'sd-card-spi', sku: 'SD-SPI', price: 900, rrp: 1200, stock: 150, imgUrl: 'https://loremflickr.com/600/600/sd,card,storage', desc: 'SPI SD card module for storing data on microSD cards.', tags: ["sd-card", "storage"] },
    { title: 'Buzzer Active 5V Module', handle: 'buzzer-active-5v', sku: 'BUZ-ACT-5V', price: 500, rrp: 700, stock: 400, imgUrl: 'https://loremflickr.com/600/600/buzzer,piezo,electronics', desc: 'Active piezo buzzer module, emits 2.5kHz tone when powered.', tags: ["buzzer", "audio"] },
    { title: 'Potentiometer 10K Ohm Rotary', handle: 'pot-10k-rotary', sku: 'POT-10K', price: 300, rrp: 450, stock: 800, imgUrl: 'https://loremflickr.com/600/600/potentiometer,knob,analog', desc: '10K ohm single-turn rotary potentiometer for analog control.', tags: ["potentiometer", "analog"] },
    { title: 'Joystick Module XY plus Button', handle: 'joystick-xy', sku: 'JOY-XY', price: 900, rrp: 1200, stock: 150, imgUrl: 'https://loremflickr.com/600/600/joystick,module,analog', desc: 'Analog joystick with X/Y axes and push button, 5V.', tags: ["joystick", "analog"] },
    { title: 'Rotary Encoder Module KY-040', handle: 'rotary-encoder-ky040', sku: 'ROT-KY040', price: 800, rrp: 1000, stock: 120, imgUrl: 'https://loremflickr.com/600/600/rotary,encoder,module', desc: 'KY-040 rotary encoder with push button, 20 pulses per revolution.', tags: ["encoder", "rotary"] },
    { title: '4x4 Matrix Keypad', handle: 'keypad-4x4', sku: 'KEYPAD-4X4', price: 1200, rrp: 1500, stock: 130, imgUrl: 'https://loremflickr.com/600/600/keypad,matrix,button', desc: '16-key 4x4 matrix membrane keypad for user input.', tags: ["keypad", "input"] },
];

const HOME_GARDEN: { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] }[] = [
    { title: 'Smart Socket WiFi Plug EU', handle: 'smart-socket-wifi-eu', sku: 'SSK-WIFI-EU', price: 12900, rrp: 15900, stock: 50, imgUrl: 'https://loremflickr.com/600/600/smart,plug,wifi', desc: 'WiFi smart plug EU type with energy monitoring and app control.', tags: ["smart-home", "wifi"] },
    { title: 'Smart Bulb E27 RGB 10W WiFi', handle: 'smart-bulb-e27-rgb', sku: 'SB-E27-RGB-10W', price: 9900, rrp: 12500, stock: 60, imgUrl: 'https://loremflickr.com/600/600/smart,bulb,rgb', desc: 'E27 10W RGBW smart bulb with WiFi, works with Google Home and Alexa.', tags: ["smart-home", "light"] },
    { title: 'Smart Light Switch 1-Gang WiFi', handle: 'smart-switch-1g-wifi', sku: 'SW-1G-WIFI', price: 15900, rrp: 19900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/smart,switch,wall', desc: 'Single gang WiFi touch switch, neutral wire required.', tags: ["smart-home", "switch"] },
    { title: 'Smart Light Switch 2-Gang WiFi', handle: 'smart-switch-2g-wifi', sku: 'SW-2G-WIFI', price: 22900, rrp: 27500, stock: 30, imgUrl: 'https://loremflickr.com/600/600/smart,switch,double', desc: '2-gang WiFi touch light switch with timing and scheduling.', tags: ["smart-home", "switch"] },
    { title: 'Smart Doorbell Camera WiFi', handle: 'smart-doorbell-camera', sku: 'DB-CAM-WIFI', price: 59900, rrp: 74900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/doorbell,camera,smart', desc: '1080P WiFi video doorbell with motion detection and two-way audio.', tags: ["smart-home", "camera"] },
    { title: 'Automatic Watering System Kit', handle: 'auto-watering-kit', sku: 'AWK-KIT', price: 8900, rrp: 10900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/watering,garden,automatic', desc: 'DIY automatic plant watering system with soil sensor and water pump.', tags: ["garden", "automation"] },
    { title: 'Soil Moisture Sensor Capacitive', handle: 'soil-moisture-cap', sku: 'SOIL-CAP-01', price: 700, rrp: 900, stock: 250, imgUrl: 'https://loremflickr.com/600/600/soil,moisture,sensor', desc: 'Anti-corrosion capacitive soil moisture sensor for plants.', tags: ["garden", "sensor"] },
    { title: 'Mini Water Pump 5V DC', handle: 'mini-pump-5v', sku: 'PUMP-5V-MINI', price: 2500, rrp: 3200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/water,pump,mini', desc: 'Submersible mini DC water pump 5V for garden irrigation projects.', tags: ["garden", "pump"] },
    { title: 'Garden LED Solar String Lights', handle: 'solar-string-led', sku: 'SOL-STR-LED', price: 14900, rrp: 18900, stock: 45, imgUrl: 'https://loremflickr.com/600/600/solar,string,lights', desc: 'Solar-powered 10m LED string lights for outdoor garden decoration.', tags: ["garden", "solar"] },
    { title: 'Rain Water Level Sensor', handle: 'rain-water-sensor', sku: 'RAIN-WTR-SEN', price: 800, rrp: 1000, stock: 200, imgUrl: 'https://loremflickr.com/600/600/rain,sensor,weather', desc: 'Rain detector and water level sensor module for Arduino.', tags: ["garden", "sensor"] },
    { title: 'Weather Station Kit DHT22', handle: 'weather-station-dht22', sku: 'WS-DHT22-KIT', price: 15900, rrp: 19900, stock: 25, imgUrl: 'https://loremflickr.com/600/600/weather,station,iot', desc: 'Complete mini weather station with temperature, humidity and pressure.', tags: ["weather", "iot"] },
    { title: 'Smart Thermostat Module', handle: 'smart-thermostat-mod', sku: 'THERM-MOD-01', price: 8900, rrp: 10900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/thermostat,smart,hvac', desc: 'WiFi thermostat controller module with relay for HVAC systems.', tags: ["smart-home", "thermostat"] },
    { title: 'Grow Light LED Full Spectrum 20W', handle: 'grow-light-20w', sku: 'GROW-LED-20W', price: 24900, rrp: 29900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/grow,light,plant', desc: '20W full spectrum LED grow light for indoor plants and hydroponics.', tags: ["garden", "led"] },
    { title: 'Ultrasonic Water Tank Level Sensor', handle: 'tank-level-sonic', sku: 'TANK-LVL-SON', price: 3200, rrp: 3900, stock: 60, imgUrl: 'https://loremflickr.com/600/600/water,tank,level', desc: 'Non-contact ultrasonic water tank level sensor with relay output.', tags: ["sensor", "water"] },
    { title: 'PIR Garden Light Controller', handle: 'pir-garden-light', sku: 'PIR-GDN-LT', price: 6900, rrp: 8500, stock: 50, imgUrl: 'https://loremflickr.com/600/600/pir,motion,garden', desc: 'PIR motion detector for automatic garden light control.', tags: ["garden", "pir"] },
    { title: 'Smart Home Hub ESP32 Based', handle: 'smart-hub-esp32', sku: 'SMH-ESP32', price: 19900, rrp: 24900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/smart,home,hub', desc: 'Open-source smart home hub based on ESP32, supports MQTT, WiFi.', tags: ["smart-home", "hub"] },
    { title: 'Zigbee Smart Plug EU 16A', handle: 'zigbee-plug-16a', sku: 'ZB-PLUG-16A', price: 16900, rrp: 20900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/zigbee,plug,smart', desc: '16A Zigbee 3.0 smart plug with energy metering.', tags: ["zigbee", "smart-home"] },
    { title: 'CO2 TVOC Air Quality Monitor', handle: 'air-quality-co2-tvoc', sku: 'AQ-CO2-TVOC', price: 22900, rrp: 27900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/air,quality,monitor', desc: 'Indoor CO2 and TVOC air quality monitor with LCD display.', tags: ["air-quality", "sensor"] },
    { title: 'Smart Lock Bluetooth Deadbolt', handle: 'smart-lock-bt', sku: 'LOCK-BT-01', price: 99900, rrp: 124900, stock: 10, imgUrl: 'https://loremflickr.com/600/600/smart,lock,door', desc: 'Keypad Bluetooth smart deadbolt lock with auto-lock and app.', tags: ["smart-home", "security"] },
    { title: 'Garden Drip Irrigation Timer', handle: 'garden-drip-timer', sku: 'GDN-DRIP-TMR', price: 18900, rrp: 23500, stock: 25, imgUrl: 'https://loremflickr.com/600/600/drip,irrigation,garden', desc: 'Digital garden hose timer with drip irrigation programming.', tags: ["garden", "irrigation"] },
    { title: 'Outdoor WiFi Security Camera 2MP', handle: 'outdoor-cam-wifi-2mp', sku: 'CAM-OD-WIFI2', price: 44900, rrp: 55900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/outdoor,camera,security', desc: '2MP outdoor bullet camera, IP67, night vision 30m, 2-way audio.', tags: ["security", "camera"] },
    { title: 'Motion Sensor Night Light USB', handle: 'motion-night-usb', sku: 'MLT-USB-01', price: 3900, rrp: 4900, stock: 100, imgUrl: 'https://loremflickr.com/600/600/motion,night,light', desc: 'USB rechargeable motion sensor LED night light for hallway.', tags: ["lighting", "motion"] },
    { title: 'Energy Monitor Clamp CT SCT-013', handle: 'energy-mon-sct013', sku: 'EMON-SCT013', price: 5900, rrp: 7200, stock: 40, imgUrl: 'https://loremflickr.com/600/600/energy,monitor,clamp', desc: 'Non-invasive AC current sensor SCT-013 100A for energy monitoring.', tags: ["energy", "sensor"] },
    { title: 'Smart Smoke Detector Wireless', handle: 'smart-smoke-wifi', sku: 'SMK-DET-WIFI', price: 29900, rrp: 36900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/smoke,detector,alarm', desc: 'WiFi-connected smoke detector with app alerts and siren 85dB.', tags: ["safety", "smoke"] },
    { title: 'Flood and Leak Water Sensor', handle: 'flood-leak-sensor', sku: 'FLD-LEAK-SEN', price: 7900, rrp: 9900, stock: 50, imgUrl: 'https://loremflickr.com/600/600/flood,leak,sensor', desc: 'Wifi flood and water leak sensor with instant app notification.', tags: ["sensor", "water"] },
    { title: 'Smart Curtain Motor WiFi', handle: 'smart-curtain-motor-wifi', sku: 'CRT-MTR-WIFI', price: 69900, rrp: 84900, stock: 10, imgUrl: 'https://loremflickr.com/600/600/curtain,motor,smart', desc: 'WiFi smart curtain/blind motor with Alexa and Google Home support.', tags: ["smart-home", "motor"] },
    { title: 'Temperature Controller W1209', handle: 'temp-ctrl-w1209', sku: 'TCTRL-W1209', price: 2500, rrp: 3200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/temperature,controller,thermostat', desc: 'W1209 digital thermostat switch with NTC sensor, -50 to 110 Celsius.', tags: ["temperature", "controller"] },
    { title: 'Automatic Gate Opener Kit', handle: 'gate-opener-kit', sku: 'GATE-OPNR-KIT', price: 149900, rrp: 189900, stock: 5, imgUrl: 'https://loremflickr.com/600/600/gate,opener,automatic', desc: 'Swing gate opener kit with remote, magnetic limit switch, 12V motor.', tags: ["gate", "automation"] },
    { title: 'Solar Panel 10W Monocrystalline', handle: 'solar-panel-10w', sku: 'SOL-PNL-10W', price: 39900, rrp: 49900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/solar,panel,energy', desc: '10W monocrystalline silicon solar panel for DIY power projects.', tags: ["solar", "power"] },
    { title: 'Hydroponics EC TDS Sensor', handle: 'hydro-ec-tds', sku: 'HYD-EC-TDS', price: 12900, rrp: 15900, stock: 25, imgUrl: 'https://loremflickr.com/600/600/hydroponics,water,sensor', desc: 'Electrical conductivity and TDS sensor for hydroponics.', tags: ["garden", "hydroponics"] },
    { title: 'pH Meter Sensor Module', handle: 'ph-sensor-module', sku: 'PH-SEN-MOD', price: 9900, rrp: 12500, stock: 30, imgUrl: 'https://loremflickr.com/600/600/ph,meter,water', desc: 'Analog pH sensor module for water quality monitoring.', tags: ["garden", "ph"] },
    { title: 'Garden Wind Speed Anemometer', handle: 'wind-speed-sensor', sku: 'WIND-SPKM-SEN', price: 14900, rrp: 18500, stock: 15, imgUrl: 'https://loremflickr.com/600/600/wind,speed,anemometer', desc: 'Anemometer wind speed sensor for home weather stations.', tags: ["weather", "wind"] },
    { title: 'Smart Pet Feeder WiFi Auto', handle: 'smart-pet-feeder', sku: 'PET-FEED-WIFI', price: 79900, rrp: 99900, stock: 10, imgUrl: 'https://loremflickr.com/600/600/pet,feeder,automatic', desc: 'Automatic WiFi pet feeder with app scheduling and portion control.', tags: ["smart-home", "pet"] },
    { title: 'LDR Light Sensor Module', handle: 'ldr-light-module', sku: 'LDR-MOD-01', price: 500, rrp: 700, stock: 400, imgUrl: 'https://loremflickr.com/600/600/light,sensor,photoresistor', desc: 'Photoresistor LDR light intensity detection module for Arduino.', tags: ["sensor", "light"] },
    { title: 'Reed Switch Magnetic Door Sensor', handle: 'reed-door-sensor', sku: 'REED-DOOR-01', price: 600, rrp: 800, stock: 300, imgUrl: 'https://loremflickr.com/600/600/reed,switch,door', desc: 'Magnetic reed switch door/window open sensor module.', tags: ["sensor", "security"] },
    { title: 'Wemos D1 Mini ESP8266', handle: 'wemos-d1-mini', sku: 'WM-D1-MINI', price: 2400, rrp: 3000, stock: 100, imgUrl: 'https://loremflickr.com/600/600/wemos,d1,wifi', desc: 'Compact WiFi development board based on ESP8266, 11 digital I/O.', tags: ["esp8266", "wifi"] },
    { title: 'Smart Power Strip 4-Way WiFi', handle: 'power-strip-4way-wifi', sku: 'PST-4W-WIFI', price: 24900, rrp: 29900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/power,strip,smart', desc: '4-outlet WiFi smart power strip with individual and group control.', tags: ["smart-home", "power"] },
    { title: 'CO Smoke Gas Detector Module', handle: 'co-gas-detector', sku: 'CO-GAS-DET', price: 4900, rrp: 6200, stock: 50, imgUrl: 'https://loremflickr.com/600/600/carbon,monoxide,detector', desc: 'MQ-7 carbon monoxide gas detector sensor module.', tags: ["sensor", "safety"] },
    { title: 'Smart IR Blaster WiFi Universal', handle: 'ir-blaster-wifi', sku: 'IR-BLST-WIFI', price: 12900, rrp: 15900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/ir,blaster,smart', desc: 'Universal WiFi IR blaster to control TVs, ACs and all IR devices.', tags: ["smart-home", "ir"] },
    { title: 'Hydroponic Grow Kit 12 Pods', handle: 'hydro-grow-kit-12', sku: 'HYD-GRW-12', price: 89900, rrp: 109900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/hydroponic,grow,kit', desc: '12-pod indoor hydroponic growing system with LED light.', tags: ["garden", "hydro"] },
    { title: 'OLED Clock WiFi NTP Sync', handle: 'oled-clock-ntp', sku: 'OLED-CLK-NTP', price: 7900, rrp: 9900, stock: 35, imgUrl: 'https://loremflickr.com/600/600/oled,clock,wifi', desc: 'WiFi NTP-synchronized OLED clock DIY kit with weather display.', tags: ["clock", "oled"] },
    { title: 'Smart Garage Door Opener WiFi', handle: 'garage-opener-wifi', sku: 'GAR-OPNR-WIFI', price: 44900, rrp: 54900, stock: 12, imgUrl: 'https://loremflickr.com/600/600/garage,door,opener', desc: 'WiFi smart garage door controller with app, auto-close timer.', tags: ["smart-home", "garage"] },
    { title: 'Ultrasonic Pest Repeller Plugin', handle: 'pest-repeller-sonic', sku: 'PEST-SON-01', price: 8900, rrp: 10900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/ultrasonic,pest,repeller', desc: 'Ultrasonic electronic pest repeller plugin, covers 80m2.', tags: ["home", "pest"] },
    { title: 'RGB Mood Lamp Bluetooth Speaker', handle: 'rgb-mood-lamp-bt', sku: 'RGB-LAMP-BT', price: 29900, rrp: 36900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/rgb,lamp,mood', desc: 'RGB LED mood lamp with Bluetooth speaker and app control.', tags: ["home", "lighting"] },
    { title: 'Wireless Doorbell Button Kit', handle: 'wireless-doorbell', sku: 'DB-WLESS-KIT', price: 12900, rrp: 15900, stock: 35, imgUrl: 'https://loremflickr.com/600/600/wireless,doorbell,button', desc: '58-melody wireless doorbell with 300m range, weatherproof button.', tags: ["home", "doorbell"] },
    { title: 'Solar Powered Garden Fountain Pump', handle: 'solar-fountain-pump', sku: 'SOL-FNT-PUMP', price: 24900, rrp: 29900, stock: 18, imgUrl: 'https://loremflickr.com/600/600/solar,fountain,garden', desc: 'Solar-powered brushless fountain pump with 4 spray heads for pond.', tags: ["garden", "solar"] },
    { title: 'Beehive Monitor IoT Kit', handle: 'beehive-monitor-iot', sku: 'BHV-IOT-KIT', price: 59900, rrp: 74900, stock: 5, imgUrl: 'https://loremflickr.com/600/600/beehive,honey,sensor', desc: 'IoT kit to monitor beehive temperature, weight and humidity.', tags: ["garden", "iot"] },
    { title: 'Home Automation Controller Board', handle: 'home-auto-controller', sku: 'HA-CTRL-BRD', price: 29900, rrp: 36900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/home,automation,controller', desc: '8-zone home automation controller with 4G, WiFi and MQTT support.', tags: ["smart-home", "automation"] },
    { title: 'Smart Irrigation Valve 12V', handle: 'smart-irr-valve', sku: 'SIRR-VALVE-12V', price: 14900, rrp: 18500, stock: 20, imgUrl: 'https://loremflickr.com/600/600/irrigation,valve,garden', desc: '12V DC latching solenoid irrigation valve for smart watering.', tags: ["garden", "irrigation"] },
    { title: 'Beehive Entrance Bee Counter', handle: 'beehive-counter', sku: 'BHV-CNT-SEN', price: 19900, rrp: 24900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/bee,hive,counter', desc: 'Optical bee counter sensor for beehive monitoring.', tags: ["garden", "beehive"] },
    { title: 'Vertical Garden Tower LED Kit', handle: 'vertical-garden-led', sku: 'VERT-GDN-LED', price: 69900, rrp: 84900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/vertical,garden,indoor', desc: '4-tier vertical indoor garden tower with full spectrum LED grow light.', tags: ["garden", "grow", "led"] },
];

const SENSORS: { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] }[] = [
    { title: 'DHT22 Temperature and Humidity Sensor', handle: 'dht22-sensor', sku: 'DHT22', price: 1800, rrp: 2200, stock: 200, imgUrl: 'https://loremflickr.com/600/600/temperature,humidity,sensor', desc: 'High precision digital temperature and humidity sensor (-40 to 80C, 0-100%RH).', tags: ["sensor", "temperature"] },
    { title: 'DHT11 Temperature and Humidity Sensor', handle: 'dht11-sensor', sku: 'DHT11', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/dht11,humidity,sensor', desc: 'Basic capacitive humidity and NTC temperature sensor module.', tags: ["sensor", "temperature"] },
    { title: 'BMP280 Barometric Pressure Sensor', handle: 'bmp280-pressure', sku: 'BMP280', price: 1500, rrp: 1900, stock: 150, imgUrl: 'https://loremflickr.com/600/600/barometric,pressure,sensor', desc: 'Bosch BMP280 barometric pressure, temperature and altitude sensor I2C/SPI.', tags: ["sensor", "pressure"] },
    { title: 'BME280 Temp Humidity Pressure 3-in-1', handle: 'bme280-3in1', sku: 'BME280', price: 2800, rrp: 3500, stock: 100, imgUrl: 'https://loremflickr.com/600/600/bme280,environment,sensor', desc: 'BME280 all-in-one environmental sensor: temp, humidity, pressure via I2C.', tags: ["sensor", "environment"] },
    { title: 'BME680 Air Quality Sensor', handle: 'bme680-air', sku: 'BME680', price: 5500, rrp: 6800, stock: 60, imgUrl: 'https://loremflickr.com/600/600/air,quality,sensor', desc: 'BME680 4-in-1 sensor: temperature, humidity, pressure and VOC gas.', tags: ["sensor", "air-quality"] },
    { title: 'Ultrasonic Distance Sensor HC-SR04', handle: 'hcsr04-distance', sku: 'HCSR04', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/ultrasonic,distance,sensor', desc: 'HC-SR04 ultrasonic ranging module, 2cm to 400cm.', tags: ["sensor", "distance"] },
    { title: 'Time-of-Flight VL53L0X Laser Sensor', handle: 'vl53l0x-tof', sku: 'VL53L0X', price: 3500, rrp: 4200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/laser,distance,tof', desc: 'VL53L0X time-of-flight laser ranging sensor, up to 2m, I2C.', tags: ["sensor", "distance"] },
    { title: 'PIR Motion Sensor HC-SR501', handle: 'pir-hcsr501', sku: 'PIR-HCSR501', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/pir,motion,detector', desc: 'Adjustable PIR motion sensor module, 3-7m range, 120 degree detection.', tags: ["sensor", "motion"] },
    { title: 'RCWL-0516 Microwave Radar Sensor', handle: 'rcwl0516-radar', sku: 'RCWL0516', price: 1500, rrp: 1900, stock: 100, imgUrl: 'https://loremflickr.com/600/600/microwave,radar,motion', desc: 'RCWL-0516 Doppler microwave motion sensor, 5-7m range through walls.', tags: ["sensor", "motion"] },
    { title: 'Accelerometer ADXL345 3-Axis', handle: 'adxl345-accel', sku: 'ADXL345', price: 2200, rrp: 2700, stock: 100, imgUrl: 'https://loremflickr.com/600/600/accelerometer,3axis,sensor', desc: 'ADXL345 3-axis digital accelerometer, 13-bit resolution, SPI/I2C.', tags: ["sensor", "accelerometer"] },
    { title: 'MPU-6050 IMU 6-Axis', handle: 'mpu6050-imu', sku: 'MPU6050', price: 1200, rrp: 1500, stock: 180, imgUrl: 'https://loremflickr.com/600/600/imu,gyroscope,sensor', desc: 'MPU-6050 6-DoF IMU: 3-axis gyro plus 3-axis accelerometer, I2C.', tags: ["sensor", "imu"] },
    { title: 'MPU-9250 IMU 9-Axis', handle: 'mpu9250-imu', sku: 'MPU9250', price: 4200, rrp: 5200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/imu,magnetometer,9axis', desc: 'MPU-9250 9-DoF IMU with gyro, accel and magnetometer.', tags: ["sensor", "imu"] },
    { title: 'Hall Effect Sensor A3144', handle: 'hall-a3144', sku: 'HALL-A3144', price: 400, rrp: 600, stock: 500, imgUrl: 'https://loremflickr.com/600/600/hall,effect,magnetic', desc: 'A3144 digital hall effect magnetic field sensor module.', tags: ["sensor", "magnetic"] },
    { title: 'Flame Sensor IR Infrared Detector', handle: 'flame-sensor-ir', sku: 'FLAME-IR', price: 700, rrp: 900, stock: 250, imgUrl: 'https://loremflickr.com/600/600/flame,fire,sensor', desc: 'IR flame sensor module, detects fire in 60 degree angle, 100cm range.', tags: ["sensor", "flame"] },
    { title: 'Gas Sensor MQ-2 Smoke LPG', handle: 'mq2-gas-smoke', sku: 'MQ2-GAS', price: 1200, rrp: 1500, stock: 200, imgUrl: 'https://loremflickr.com/600/600/smoke,gas,mq2', desc: 'MQ-2 semiconductor gas sensor for smoke, LPG, butane, methane.', tags: ["sensor", "gas"] },
    { title: 'Gas Sensor MQ-135 Air Quality', handle: 'mq135-air', sku: 'MQ135-AQ', price: 1200, rrp: 1500, stock: 200, imgUrl: 'https://loremflickr.com/600/600/air,quality,gas', desc: 'MQ-135 air quality sensor for NH3, NOx, alcohol, benzene, CO2.', tags: ["sensor", "gas"] },
    { title: 'Alcohol Sensor MQ-3', handle: 'mq3-alcohol', sku: 'MQ3-ALCO', price: 1200, rrp: 1500, stock: 150, imgUrl: 'https://loremflickr.com/600/600/alcohol,sensor,gas', desc: 'MQ-3 semiconductor sensor for ethanol/alcohol concentration detection.', tags: ["sensor", "alcohol"] },
    { title: 'Color Sensor TCS34725', handle: 'tcs34725-color', sku: 'TCS34725', price: 3500, rrp: 4200, stock: 70, imgUrl: 'https://loremflickr.com/600/600/color,sensor,rgb', desc: 'TCS34725 RGB color sensor with IR filter and white LED, I2C.', tags: ["sensor", "color"] },
    { title: 'Ambient Light Sensor BH1750', handle: 'bh1750-light', sku: 'BH1750', price: 1500, rrp: 1900, stock: 150, imgUrl: 'https://loremflickr.com/600/600/light,lux,sensor', desc: 'BH1750 digital ambient light intensity sensor, 1-65535 lux, I2C.', tags: ["sensor", "light"] },
    { title: 'UV Index Sensor ML8511', handle: 'ml8511-uv', sku: 'ML8511-UV', price: 2200, rrp: 2700, stock: 80, imgUrl: 'https://loremflickr.com/600/600/uv,ultraviolet,sensor', desc: 'ML8511 UV light sensor module, outputs voltage proportional to UV index.', tags: ["sensor", "uv"] },
    { title: 'Current Sensor ACS712 5A', handle: 'acs712-5a', sku: 'ACS712-5A', price: 1500, rrp: 1900, stock: 120, imgUrl: 'https://loremflickr.com/600/600/current,sensor,power', desc: 'ACS712 hall-effect based current measurement module, 5A range.', tags: ["sensor", "current"] },
    { title: 'Current Sensor ACS712 30A', handle: 'acs712-30a', sku: 'ACS712-30A', price: 1800, rrp: 2300, stock: 100, imgUrl: 'https://loremflickr.com/600/600/current,30a,sensor', desc: 'ACS712 current sensor module, 30A measure range.', tags: ["sensor", "current"] },
    { title: 'Water Flow Sensor YF-S201', handle: 'water-flow-yfs201', sku: 'YFS201', price: 2800, rrp: 3500, stock: 60, imgUrl: 'https://loremflickr.com/600/600/water,flow,sensor', desc: 'YF-S201 Hall-effect water flow sensor 1-30L/min, G1/2 threaded.', tags: ["sensor", "water"] },
    { title: 'Load Cell 1kg plus HX711 ADC', handle: 'load-cell-1kg-hx711', sku: 'LOADCELL-1KG', price: 2500, rrp: 3200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/load,cell,weight', desc: '1kg load cell with HX711 24-bit ADC amplifier for weight measurement.', tags: ["sensor", "weight"] },
    { title: 'Fingerprint Sensor AS608', handle: 'fingerprint-as608', sku: 'FP-AS608', price: 14900, rrp: 18500, stock: 20, imgUrl: 'https://loremflickr.com/600/600/fingerprint,sensor,biometric', desc: 'AS608 optical fingerprint sensor module for access control, UART.', tags: ["sensor", "biometric"] },
    { title: 'Gesture Sensor APDS-9960', handle: 'apds9960-gesture', sku: 'APDS9960', price: 3500, rrp: 4200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/gesture,proximity,sensor', desc: 'APDS-9960 digital proximity, ambient light, RGB and gesture sensor.', tags: ["sensor", "gesture"] },
    { title: 'Sound Sensor KY-038', handle: 'sound-ky038', sku: 'KY038-SND', price: 600, rrp: 800, stock: 300, imgUrl: 'https://loremflickr.com/600/600/sound,microphone,sensor', desc: 'KY-038 sound detection sensor module with digital and analog outputs.', tags: ["sensor", "sound"] },
    { title: 'Vibration Sensor SW-420', handle: 'vibration-sw420', sku: 'SW420-VIB', price: 500, rrp: 700, stock: 350, imgUrl: 'https://loremflickr.com/600/600/vibration,tilt,sensor', desc: 'SW-420 vibration switch tilt sensor module for alarm applications.', tags: ["sensor", "vibration"] },
    { title: 'Tilt Sensor Ball Switch', handle: 'tilt-ball-switch', sku: 'TILT-BALL', price: 400, rrp: 600, stock: 400, imgUrl: 'https://loremflickr.com/600/600/tilt,ball,switch', desc: 'Two-ball tilt switch sensor module, digital output, 3.3-5V.', tags: ["sensor", "tilt"] },
    { title: 'Heartrate Pulse Sensor MAX30102', handle: 'heartrate-max30102', sku: 'MAX30102-HR', price: 4500, rrp: 5500, stock: 40, imgUrl: 'https://loremflickr.com/600/600/heartrate,pulse,oximeter', desc: 'MAX30102 pulse oximetry and heart-rate sensor module, I2C.', tags: ["sensor", "heartrate"] },
    { title: 'Thermal Infrared Sensor MLX90614', handle: 'mlx90614-thermal', sku: 'MLX90614', price: 8900, rrp: 10900, stock: 25, imgUrl: 'https://loremflickr.com/600/600/thermal,infrared,temperature', desc: 'Melexis MLX90614 non-contact IR temperature sensor, -70 to 380C.', tags: ["sensor", "temperature"] },
    { title: 'LIDAR Distance Sensor TF-Luna', handle: 'tfluna-lidar', sku: 'TF-LUNA', price: 19900, rrp: 24900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/lidar,laser,distance', desc: 'TF-Luna single-point LIDAR sensor, 0.2-8m range, UART/I2C.', tags: ["sensor", "lidar"] },
    { title: 'Flex Bend Sensor 2.2 inch', handle: 'flex-sensor-22', sku: 'FLEX-2.2IN', price: 3500, rrp: 4300, stock: 50, imgUrl: 'https://loremflickr.com/600/600/flex,bend,wearable', desc: '2.2 inch flexible resistive bend sensor for wearables.', tags: ["sensor", "flex"] },
    { title: 'Force Sensitive Resistor FSR402', handle: 'fsr402-force', sku: 'FSR402', price: 2500, rrp: 3200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/force,pressure,resistor', desc: 'FSR402 force sensitive resistor, 0-10N range, round 12.5mm.', tags: ["sensor", "force"] },
    { title: 'Turbidity Sensor for Water', handle: 'turbidity-water', sku: 'TRB-WTR-01', price: 3200, rrp: 4000, stock: 40, imgUrl: 'https://loremflickr.com/600/600/water,turbidity,quality', desc: 'Optic turbidity sensor for detecting water clarity and suspended solids.', tags: ["sensor", "water"] },
    { title: 'IR Obstacle Avoidance Sensor', handle: 'ir-obstacle-sensor', sku: 'IR-OBS-01', price: 600, rrp: 800, stock: 400, imgUrl: 'https://loremflickr.com/600/600/infrared,obstacle,robot', desc: 'IR infrared obstacle avoidance detection sensor for robotics.', tags: ["sensor", "ir"] },
    { title: 'Line Tracking Sensor TCRT5000', handle: 'line-track-tcrt5000', sku: 'TCRT5000', price: 500, rrp: 700, stock: 500, imgUrl: 'https://loremflickr.com/600/600/line,tracking,robot', desc: 'TCRT5000 reflective IR line tracking sensor for robot line-followers.', tags: ["sensor", "line"] },
    { title: 'Speed Sensor Hall LM393', handle: 'speed-hall-lm393', sku: 'SPEED-LM393', price: 600, rrp: 800, stock: 300, imgUrl: 'https://loremflickr.com/600/600/speed,hall,motor', desc: 'Hall-effect speed sensor module with LM393 comparator for motor speed.', tags: ["sensor", "speed"] },
    { title: 'Inductive Proximity Sensor LJ12A3', handle: 'inductive-prox-lj12a3', sku: 'LJ12A3-PROX', price: 4500, rrp: 5500, stock: 40, imgUrl: 'https://loremflickr.com/600/600/inductive,proximity,sensor', desc: 'LJ12A3 NPN 12mm inductive proximity switch sensor 6-36VDC.', tags: ["sensor", "proximity"] },
    { title: 'Capacitive Proximity Sensor 12mm', handle: 'cap-prox-12mm', sku: 'CAP-PROX-12', price: 4800, rrp: 5900, stock: 35, imgUrl: 'https://loremflickr.com/600/600/capacitive,proximity,sensor', desc: '12mm capacitive proximity sensor, detects metal and non-metal.', tags: ["sensor", "proximity"] },
    { title: 'Compass Magnetometer HMC5883L', handle: 'compass-hmc5883l', sku: 'HMC5883L', price: 1900, rrp: 2400, stock: 100, imgUrl: 'https://loremflickr.com/600/600/compass,magnetometer,sensor', desc: 'HMC5883L 3-axis digital compass magnetometer module, I2C.', tags: ["sensor", "compass"] },
    { title: 'Angle Sensor Potentiometer WH148', handle: 'angle-sensor-wh148', sku: 'ANGLE-WH148', price: 800, rrp: 1000, stock: 200, imgUrl: 'https://loremflickr.com/600/600/angle,rotary,potentiometer', desc: 'Rotary angle sensor WH148 potentiometer module 270 degree range.', tags: ["sensor", "angle"] },
    { title: 'Moisture and Temperature SHT31', handle: 'sht31-moisture', sku: 'SHT31', price: 4900, rrp: 5900, stock: 60, imgUrl: 'https://loremflickr.com/600/600/humidity,temperature,sht31', desc: 'SHT31 high accuracy humidity and temperature sensor, I2C.', tags: ["sensor", "humidity"] },
    { title: 'Barometric Pressure Sensor MS5611', handle: 'ms5611-baro', sku: 'MS5611', price: 5500, rrp: 6800, stock: 40, imgUrl: 'https://loremflickr.com/600/600/barometric,altitude,pressure', desc: 'MS5611 high resolution barometric pressure sensor for altimeters.', tags: ["sensor", "pressure"] },
    { title: 'Soil Temperature Probe DS18B20', handle: 'ds18b20-soil-probe', sku: 'DS18B20-SLP', price: 1500, rrp: 1900, stock: 200, imgUrl: 'https://loremflickr.com/600/600/temperature,probe,waterproof', desc: 'DS18B20 waterproof digital temperature probe, -55 to 125C, 1-Wire.', tags: ["sensor", "temperature"] },
    { title: 'Optical Encoder Wheel 5V', handle: 'optical-encoder-5v', sku: 'OPT-ENC-5V', price: 700, rrp: 900, stock: 250, imgUrl: 'https://loremflickr.com/600/600/encoder,optical,wheel', desc: 'Optical encoder wheel module for speed and position sensing.', tags: ["sensor", "encoder"] },
    { title: 'Ozone Sensor MQ-131 Module', handle: 'ozone-mq131', sku: 'MQ131-OZ', price: 3200, rrp: 3900, stock: 35, imgUrl: 'https://loremflickr.com/600/600/ozone,air,sensor', desc: 'MQ-131 semiconductor ozone concentration sensor module.', tags: ["sensor", "ozone"] },
    { title: 'Radar Speed Sensor Doppler HB100', handle: 'doppler-radar-speed', sku: 'DOP-RAD-SPD', price: 8900, rrp: 10900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/radar,speed,doppler', desc: 'HB100 10.525GHz Doppler radar module for speed measurement.', tags: ["sensor", "radar"] },
    { title: 'Alcohol Breathalyzer MQ-303A', handle: 'breathalyzer-mq303a', sku: 'MQ303A-BREA', price: 2200, rrp: 2800, stock: 50, imgUrl: 'https://loremflickr.com/600/600/breathalyzer,alcohol,sensor', desc: 'MQ-303A low-power alcohol sensor for breathalyzer applications.', tags: ["sensor", "alcohol"] },
    { title: 'Barometric Altitude Sensor BMP388', handle: 'bmp388-baro', sku: 'BMP388', price: 3200, rrp: 3900, stock: 60, imgUrl: 'https://loremflickr.com/600/600/barometric,altitude,sensor', desc: 'BMP388 precision barometric pressure sensor, altitude resolution 0.25m.', tags: ["sensor", "pressure"] },
];

const LEDS: { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] }[] = [
    { title: 'Red LED 5mm Through-Hole', handle: 'red-led-5mm', sku: 'LED-RED-5MM', price: 50, rrp: 100, stock: 2000, imgUrl: 'https://loremflickr.com/600/600/red,led,light', desc: 'Standard red 5mm through-hole LED, Vf=2.0V, 20mA, 630nm.', tags: ["led", "red"] },
    { title: 'Blue LED 5mm Through-Hole', handle: 'blue-led-5mm', sku: 'LED-BLUE-5MM', price: 50, rrp: 100, stock: 2000, imgUrl: 'https://loremflickr.com/600/600/blue,led,light', desc: 'Standard blue 5mm through-hole LED, Vf=3.2V, 20mA, 470nm.', tags: ["led", "blue"] },
    { title: 'Green LED 5mm Through-Hole', handle: 'green-led-5mm', sku: 'LED-GRN-5MM', price: 50, rrp: 100, stock: 2000, imgUrl: 'https://loremflickr.com/600/600/green,led,light', desc: 'Standard green 5mm through-hole LED, 525nm wavelength.', tags: ["led", "green"] },
    { title: 'Yellow LED 5mm Through-Hole', handle: 'yellow-led-5mm', sku: 'LED-YEL-5MM', price: 50, rrp: 100, stock: 2000, imgUrl: 'https://loremflickr.com/600/600/yellow,led,light', desc: 'Standard yellow 5mm through-hole LED, 590nm.', tags: ["led", "yellow"] },
    { title: 'White LED 5mm Through-Hole', handle: 'white-led-5mm', sku: 'LED-WHT-5MM', price: 60, rrp: 120, stock: 2000, imgUrl: 'https://loremflickr.com/600/600/white,led,light', desc: 'Bright white 5mm through-hole LED, 6000K cool white.', tags: ["led", "white"] },
    { title: 'Warm White LED 5mm', handle: 'warm-white-led-5mm', sku: 'LED-WWHT-5MM', price: 60, rrp: 120, stock: 1500, imgUrl: 'https://loremflickr.com/600/600/warm,white,led', desc: 'Warm white 5mm LED, 3000K, CRI>80.', tags: ["led", "warm-white"] },
    { title: 'UV Ultraviolet LED 5mm 395nm', handle: 'uv-led-5mm-395', sku: 'LED-UV-5MM-395', price: 80, rrp: 150, stock: 1000, imgUrl: 'https://loremflickr.com/600/600/ultraviolet,uv,led', desc: '5mm UV (ultraviolet) LED 395nm for fluorescence and detection.', tags: ["led", "uv"] },
    { title: 'IR Infrared LED 5mm 940nm', handle: 'ir-led-5mm-940', sku: 'LED-IR-940', price: 80, rrp: 150, stock: 1000, imgUrl: 'https://loremflickr.com/600/600/infrared,ir,led', desc: '940nm infrared emission LED for remote controls and sensors.', tags: ["led", "ir"] },
    { title: 'RGB LED Common Cathode 5mm', handle: 'rgb-led-cc-5mm', sku: 'LED-RGB-CC-5', price: 100, rrp: 180, stock: 1500, imgUrl: 'https://loremflickr.com/600/600/rgb,led,color', desc: '5mm RGB LED common cathode, one package with R/G/B in one.', tags: ["led", "rgb"] },
    { title: 'RGB LED Common Anode 5mm', handle: 'rgb-led-ca-5mm', sku: 'LED-RGB-CA-5', price: 100, rrp: 180, stock: 1500, imgUrl: 'https://loremflickr.com/600/600/rgb,color,led', desc: '5mm RGB LED common anode for direct Arduino digital output.', tags: ["led", "rgb"] },
    { title: 'SMD LED 0805 Red 100pcs', handle: 'smd-0805-red-100', sku: 'SMD-0805-RED-100', price: 500, rrp: 700, stock: 500, imgUrl: 'https://loremflickr.com/600/600/smd,led,surface', desc: '100-piece pack of 0805 SMD red LEDs, 620-630nm.', tags: ["led", "smd"] },
    { title: 'SMD LED 0805 Color Kit 300pcs', handle: 'smd-0805-kit', sku: 'SMD-0805-KIT', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/smd,led,kit', desc: 'Assorted 0805 SMD LED kit - 300pcs Red/Green/Blue/Yellow/White.', tags: ["led", "smd"] },
    { title: 'High Power LED 1W Red 45lm', handle: 'hpower-led-1w-red', sku: 'HP-LED-1W-RED', price: 300, rrp: 450, stock: 500, imgUrl: 'https://loremflickr.com/600/600/high,power,led', desc: '1W high-power red LED, 45 lumens, 2.1-2.4V forward voltage.', tags: ["led", "high-power"] },
    { title: 'High Power LED 3W White', handle: 'hpower-led-3w-white', sku: 'HP-LED-3W-WHT', price: 600, rrp: 900, stock: 300, imgUrl: 'https://loremflickr.com/600/600/high,power,white', desc: '3W cool white high-power LED die, 200-240 lumens, on star PCB.', tags: ["led", "high-power"] },
    { title: 'High Power LED 10W White COB', handle: 'cob-led-10w-white', sku: 'COB-LED-10W', price: 1500, rrp: 1900, stock: 150, imgUrl: 'https://loremflickr.com/600/600/cob,led,chip', desc: '10W COB (chip-on-board) cool white LED, 900-1000 lumens.', tags: ["led", "cob"] },
    { title: 'LED Strip WS2812B 1m 60 LEDs', handle: 'ws2812b-1m-60', sku: 'WS2812B-1M-60', price: 4500, rrp: 5500, stock: 70, imgUrl: 'https://loremflickr.com/600/600/led,strip,ws2812b', desc: 'WS2812B addressable RGB LED strip 1m 60LEDs/m, black PCB, IP30.', tags: ["led", "strip"] },
    { title: 'LED Strip WS2812B 1m 144 LEDs', handle: 'ws2812b-1m-144', sku: 'WS2812B-1M-144', price: 8900, rrp: 10900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/led,strip,dense', desc: 'High density WS2812B 144 LEDs per meter, 1m length.', tags: ["led", "strip"] },
    { title: 'LED Strip 5050 RGB 5m 300 LEDs 12V', handle: 'rgb-strip-5050-5m', sku: '5050-RGB-5M-300', price: 5900, rrp: 7200, stock: 50, imgUrl: 'https://loremflickr.com/600/600/rgb,led,strip', desc: '5050 SMD RGB LED strip 5m 300 LEDs, 12V, non-waterproof.', tags: ["led", "strip"] },
    { title: 'LED Strip 2835 Warm White 5m', handle: '2835-ww-5m', sku: '2835-WW-5M', price: 4200, rrp: 5200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/warm,white,strip', desc: '2835 SMD warm white LED strip 5m 300 LEDs 12V, 2700K.', tags: ["led", "strip"] },
    { title: 'LED Strip COB Warm White 1m', handle: 'cob-strip-ww-1m', sku: 'COB-WW-1M', price: 3200, rrp: 3900, stock: 80, imgUrl: 'https://loremflickr.com/600/600/cob,strip,led', desc: 'COB linear LED strip 1m 480 LEDs/m 3000K warm white, CRI>90.', tags: ["led", "cob"] },
    { title: 'LED Matrix 8x8 MAX7219', handle: 'led-matrix-8x8-max7219', sku: 'LED-8X8-MAX72', price: 1500, rrp: 1900, stock: 120, imgUrl: 'https://loremflickr.com/600/600/led,matrix,display', desc: '8x8 LED dot matrix module with MAX7219 SPI driver.', tags: ["led", "matrix"] },
    { title: 'LED Bar Graph 10-Segment Red', handle: 'led-bargraph-10-red', sku: 'LED-BAR-10-RED', price: 400, rrp: 600, stock: 300, imgUrl: 'https://loremflickr.com/600/600/led,bar,graph', desc: '10-segment red LED bar graph for level indicator displays.', tags: ["led", "bar"] },
    { title: 'LED Ring 24 WS2812 Diffused', handle: 'led-ring-24-ws2812', sku: 'LED-RING-24-WS', price: 5500, rrp: 6800, stock: 50, imgUrl: 'https://loremflickr.com/600/600/led,ring,circular', desc: '24 individually addressable WS2812B LEDs in a ring, diffused.', tags: ["led", "ring"] },
    { title: 'LED Cube 4x4x4 Blue DIY Kit', handle: 'led-cube-4x4x4', sku: 'LED-CUBE-4X4', price: 15900, rrp: 19900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/led,cube,3d', desc: '3D LED cube 4x4x4=64 blue LEDs DIY soldering kit with Arduino code.', tags: ["led", "cube"] },
    { title: 'Dual-Color LED Red-Green 5mm', handle: 'bicolor-led-rg-5mm', sku: 'LED-BCLR-RG', price: 80, rrp: 140, stock: 800, imgUrl: 'https://loremflickr.com/600/600/bicolor,led,dual', desc: '5mm bi-color LED (red and green) for status indicators.', tags: ["led", "bicolor"] },
    { title: 'Flashing Red LED 5mm Auto', handle: 'flashing-led-red', sku: 'LED-FLASH-RED', price: 80, rrp: 140, stock: 600, imgUrl: 'https://loremflickr.com/600/600/flashing,red,led', desc: '5mm self-flashing red LED at approx 3Hz, no driver required.', tags: ["led", "flashing"] },
    { title: 'RGB LED Module KY-016', handle: 'rgb-module-ky016', sku: 'KY016-RGB', price: 500, rrp: 700, stock: 300, imgUrl: 'https://loremflickr.com/600/600/rgb,module,ky016', desc: 'KY-016 RGB LED module with current-limiting resistors, 3 PWM inputs.', tags: ["led", "module"] },
    { title: 'WS2811 LED Pixel Node String 50px', handle: 'ws2811-pixel-string', sku: 'WS2811-STR-50', price: 8900, rrp: 10900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/pixel,string,led', desc: '50-pixel WS2811 LED bullet pixel string, IP68, 3cm spacing.', tags: ["led", "pixel"] },
    { title: 'SK6812 RGBW LED Strip 1m 60 LEDs', handle: 'sk6812-rgbw-1m', sku: 'SK6812-RGBW-1M', price: 6500, rrp: 7900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/rgbw,sk6812,strip', desc: 'SK6812 addressable RGBW (cool white) LED strip 1m at 60 LEDs/m.', tags: ["led", "rgbw"] },
    { title: 'APA102 Dotstar LED Strip 1m 60px', handle: 'apa102-1m-60', sku: 'APA102-1M-60', price: 7500, rrp: 9200, stock: 30, imgUrl: 'https://loremflickr.com/600/600/apa102,dotstar,spi', desc: 'APA102 DotStar SPI LED strip 1m 60 LEDs, high refresh rate.', tags: ["led", "apa102"] },
    { title: 'LED Floodlight 10W Warm White IP65', handle: 'flood-10w-ww-ip65', sku: 'FLD-10W-WW-IP65', price: 15900, rrp: 19900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/floodlight,outdoor,led', desc: '10W LED floodlight warm white IP65 waterproof for outdoor lighting.', tags: ["led", "flood"] },
    { title: 'LED Floodlight 30W Cool White IP65', handle: 'flood-30w-cw-ip65', sku: 'FLD-30W-CW-IP65', price: 29900, rrp: 36900, stock: 12, imgUrl: 'https://loremflickr.com/600/600/floodlight,30w,outdoor', desc: '30W LED floodlight 6500K IP65 outdoor security/garden light.', tags: ["led", "flood"] },
    { title: 'LED Driver Constant Current 12W', handle: 'led-driver-cc-12w', sku: 'LEDC-CC-12W', price: 4900, rrp: 6200, stock: 50, imgUrl: 'https://loremflickr.com/600/600/led,driver,power', desc: '12W constant current LED driver 300mA for LED panels.', tags: ["led", "driver"] },
    { title: 'PWM LED Dimmer 12V 8A', handle: 'pwm-dimmer-12v-8a', sku: 'PWM-DIM-8A', price: 3500, rrp: 4300, stock: 60, imgUrl: 'https://loremflickr.com/600/600/pwm,dimmer,led', desc: '12V 8A PWM LED light strip dimmer with knob or switch control.', tags: ["led", "dimmer"] },
    { title: 'LED Traffic Light Module RGB', handle: 'traffic-led-ryg', sku: 'TRAF-LED-RYG', price: 600, rrp: 800, stock: 250, imgUrl: 'https://loremflickr.com/600/600/traffic,light,led', desc: 'Traffic light LED module with red, yellow and green LEDs.', tags: ["led", "traffic"] },
    { title: 'WS2813 Dual-Signal LED Strip 1m', handle: 'ws2813-1m-60', sku: 'WS2813-1M-60', price: 5900, rrp: 7200, stock: 35, imgUrl: 'https://loremflickr.com/600/600/ws2813,strip,addressable', desc: 'WS2813 improved dual-signal addressable RGB LED, 1m 60 LEDs.', tags: ["led", "ws2813"] },
    { title: 'RGBWW LED Strip COB 1m 5in1', handle: 'rgbww-cob-1m', sku: 'RGBWW-COB-1M', price: 7200, rrp: 8900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/rgbww,cob,strip', desc: '5-in-1 RGBWW COB LED strip with R/G/B/Warm-White/Cool-White.', tags: ["led", "rgbww"] },
    { title: 'LED USB Grow Light Clip 10W', handle: 'led-grow-clip-10w', sku: 'GROW-USB-10W', price: 12900, rrp: 15900, stock: 25, imgUrl: 'https://loremflickr.com/600/600/grow,light,plant', desc: '10W USB full spectrum LED grow clip light for indoor seedlings.', tags: ["led", "grow"] },
    { title: 'LED Strip IP67 Waterproof RGB 5m', handle: 'rgb-strip-ip67-5m', sku: 'RGB-IP67-5M', price: 7900, rrp: 9900, stock: 40, imgUrl: 'https://loremflickr.com/600/600/waterproof,led,strip', desc: 'IP67 waterproof 5050 RGB LED strip 5m for outdoor and pools.', tags: ["led", "waterproof"] },
    { title: 'Flexible LED Neon Strip 1m RGB', handle: 'neon-strip-1m-rgb', sku: 'NEON-FLEX-1M', price: 8900, rrp: 10900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/neon,led,flexible', desc: 'RGB flexible LED neon strip silicone 12V 1m, 60 degree beam angle.', tags: ["led", "neon"] },
    { title: 'LED Controller RGB 12V 3-Channel', handle: 'led-ctrl-rgb-12v', sku: 'LED-CTRL-RGB', price: 2500, rrp: 3200, stock: 80, imgUrl: 'https://loremflickr.com/600/600/led,controller,rgb', desc: '12V 3-channel RGB LED strip controller, screw terminal, 6A max.', tags: ["led", "controller"] },
    { title: 'LED Controller RGB WiFi Music Sync', handle: 'led-ctrl-wifi-music', sku: 'LEDCTRL-WIFI-MUSIC', price: 8900, rrp: 10900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/led,wifi,music', desc: 'WiFi LED strip controller with music sync, app control and schedules.', tags: ["led", "controller"] },
    { title: 'LED Grid Panel 8x32 WS2812B', handle: 'led-grid-8x32', sku: 'LED-GRID-8X32', price: 14900, rrp: 18500, stock: 15, imgUrl: 'https://loremflickr.com/600/600/led,panel,matrix', desc: '8x32 = 256 WS2812B addressable LED panel for scrolling text.', tags: ["led", "matrix"] },
    { title: 'Piranha Super Flux LED 5mm Red', handle: 'piranha-led-red', sku: 'LED-PIR-RED', price: 120, rrp: 200, stock: 800, imgUrl: 'https://loremflickr.com/600/600/piranha,flux,led', desc: 'Piranha super flux 4-pin 5mm high-output red LED, 3000mcd.', tags: ["led", "piranha"] },
    { title: 'LED Resistor Assortment Kit', handle: 'led-resistor-kit', sku: 'RES-LED-KIT', price: 800, rrp: 1000, stock: 200, imgUrl: 'https://loremflickr.com/600/600/resistor,kit,electronics', desc: 'Assortment of current-limiting resistors for LEDs: 68Ohm to 1KOhm 200pcs.', tags: ["resistor", "led"] },
    { title: 'LED Diffuser Cap 5mm White 100pcs', handle: 'led-diffuser-5mm-100', sku: 'LED-DIFF-5-100', price: 500, rrp: 700, stock: 300, imgUrl: 'https://loremflickr.com/600/600/diffuser,cap,led', desc: 'Frosted white diffuser LED caps for 5mm LEDs, 100 pack.', tags: ["led", "diffuser"] },
    { title: 'Stair Step LED Riser Strip 12V', handle: 'stair-led-strip', sku: 'STAIR-LED-12V', price: 5900, rrp: 7200, stock: 20, imgUrl: 'https://loremflickr.com/600/600/stair,led,interior', desc: 'LED stair riser strip light 12V warm white, 1m adhesive backed.', tags: ["led", "stair"] },
    { title: 'LED Rope Light 10m RGB 12V', handle: 'rope-led-10m-rgb', sku: 'ROPE-LED-10M', price: 14900, rrp: 18500, stock: 15, imgUrl: 'https://loremflickr.com/600/600/rope,led,decoration', desc: '10m RGB LED rope light 3-wire 12V with controller for decoration.', tags: ["led", "rope"] },
    { title: 'Star LED 5mm Clear Lens White', handle: 'star-led-wht-5mm', sku: 'LED-STAR-WHT', price: 80, rrp: 150, stock: 1000, imgUrl: 'https://loremflickr.com/600/600/star,led,white', desc: '5mm cool clear lens LED with star-shaped glow effect.', tags: ["led", "white"] },
    { title: 'Backlight LED Strip 30cm Cool White', handle: 'backlight-strip-30cm', sku: 'LED-BKL-30CM', price: 1200, rrp: 1600, stock: 200, imgUrl: 'https://loremflickr.com/600/600/backlight,led,strip', desc: '30cm cool white LED backlight strip with adhesive backing, 12V.', tags: ["led", "backlight"] },
];

const NEOPIXELS: { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] }[] = [
    { title: 'NeoPixel Ring 8 WS2812B', handle: 'neopixel-ring-8', sku: 'NP-RING-8', price: 2900, rrp: 3600, stock: 100, imgUrl: 'https://loremflickr.com/600/600/neopixel,ring,led', desc: '8 RGB WS2812B NeoPixels in a 32mm ring, Adafruit-compatible.', tags: ["neopixel", "ring"] },
    { title: 'NeoPixel Ring 12 WS2812B', handle: 'neopixel-ring-12', sku: 'NP-RING-12', price: 3900, rrp: 4800, stock: 80, imgUrl: 'https://loremflickr.com/600/600/neopixel,ring,ws2812b', desc: '12 RGB NeoPixel WS2812B ring, 37mm outer diameter.', tags: ["neopixel", "ring"] },
    { title: 'NeoPixel Ring 16 WS2812B', handle: 'neopixel-ring-16', sku: 'NP-RING-16', price: 4500, rrp: 5500, stock: 80, imgUrl: 'https://loremflickr.com/600/600/neopixel,16,ring', desc: '16 WS2812B NeoPixel LEDs arranged in a ring, 44mm outer diameter.', tags: ["neopixel", "ring"] },
    { title: 'NeoPixel Ring 24 WS2812B', handle: 'neopixel-ring-24', sku: 'NP-RING-24', price: 5900, rrp: 7200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/neopixel,24,ring', desc: '24 NeoPixel WS2812B in a 63mm ring, ultra-bright RGB.', tags: ["neopixel", "ring"] },
    { title: 'NeoPixel Jewel 7 WS2812B', handle: 'neopixel-jewel-7', sku: 'NP-JEWEL-7', price: 3200, rrp: 4000, stock: 90, imgUrl: 'https://loremflickr.com/600/600/neopixel,jewel,disc', desc: '7 WS2812B NeoPixels in a compact 23mm circular jewel layout.', tags: ["neopixel", "jewel"] },
    { title: 'NeoPixel Stick 8 WS2812B', handle: 'neopixel-stick-8', sku: 'NP-STICK-8', price: 2500, rrp: 3200, stock: 120, imgUrl: 'https://loremflickr.com/600/600/neopixel,stick,linear', desc: '8 WS2812B NeoPixels on a 50mm stick PCB for easy mounting.', tags: ["neopixel", "stick"] },
    { title: 'NeoPixel Grid 4x8 WS2812B', handle: 'neopixel-grid-4x8', sku: 'NP-GRID-4X8', price: 7900, rrp: 9800, stock: 40, imgUrl: 'https://loremflickr.com/600/600/neopixel,grid,panel', desc: '32 NeoPixels in a 4x8 grid, panel format with mounting holes.', tags: ["neopixel", "grid"] },
    { title: 'NeoPixel Matrix 8x8 WS2812B', handle: 'neopixel-matrix-8x8', sku: 'NP-MTX-8X8', price: 12900, rrp: 15900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/neopixel,matrix,8x8', desc: '64 WS2812B 8x8 NeoPixel matrix, individually addressable RGB.', tags: ["neopixel", "matrix"] },
    { title: 'Flora RGB NeoPixel 5mm Disc', handle: 'flora-neopixel-5mm', sku: 'FLR-NP-5MM', price: 1500, rrp: 1900, stock: 200, imgUrl: 'https://loremflickr.com/600/600/flora,neopixel,wearable', desc: 'Flora RGB smart NeoPixel 5mm disc, ideal for wearables and e-textiles.', tags: ["neopixel", "wearable"] },
    { title: 'NeoPixel Button 12mm RGBW', handle: 'neopixel-btn-12mm-rgbw', sku: 'NP-BTN-RGBW', price: 2800, rrp: 3500, stock: 80, imgUrl: 'https://loremflickr.com/600/600/neopixel,button,rgbw', desc: '12mm NeoPixel RGBW LED with mounting holes for panel installation.', tags: ["neopixel", "rgbw"] },
    { title: 'NeoPixel Strip 30 LEDs per m 1m', handle: 'np-strip-30-1m-blk', sku: 'NP-STR-30BLK', price: 3500, rrp: 4300, stock: 80, imgUrl: 'https://loremflickr.com/600/600/neopixel,strip,30', desc: 'WS2812B NeoPixel strip at 30 LEDs/m, 1m on black PCB, IP30.', tags: ["neopixel", "strip"] },
    { title: 'NeoPixel Strip 60 LEDs per m 1m', handle: 'np-strip-60-1m-wht', sku: 'NP-STR-60WHT', price: 5500, rrp: 6800, stock: 60, imgUrl: 'https://loremflickr.com/600/600/neopixel,strip,60', desc: 'WS2812B NeoPixel strip 60 LEDs/m, 1m, white PCB.', tags: ["neopixel", "strip"] },
    { title: 'NeoPixel Strip 60 LEDs per m IP65', handle: 'np-strip-60-1m-ip65', sku: 'NP-STR-60-IP65', price: 7200, rrp: 8900, stock: 50, imgUrl: 'https://loremflickr.com/600/600/neopixel,waterproof,strip', desc: 'WS2812B NeoPixel strip 60 LEDs/m, 1m, IP65 silicone coated.', tags: ["neopixel", "strip"] },
    { title: 'NeoPixel Strip 144 LEDs per m 0.5m', handle: 'np-strip-144-05m', sku: 'NP-STR-144-05M', price: 7900, rrp: 9800, stock: 40, imgUrl: 'https://loremflickr.com/600/600/neopixel,144,dense', desc: 'Ultra-dense 144 LEDs/m WS2812B strip, 0.5m length.', tags: ["neopixel", "strip"] },
    { title: 'RGBW NeoPixel Strip SK6812 1m', handle: 'sk6812-rgbw-strip-1m', sku: 'SK6812-RGBW-ST', price: 6500, rrp: 7900, stock: 45, imgUrl: 'https://loremflickr.com/600/600/sk6812,rgbw,strip', desc: 'SK6812 RGBW (+ natural white) individually addressable LED strip 1m.', tags: ["neopixel", "rgbw"] },
    { title: 'NeoPixel Feather Wing 32x8', handle: 'feather-wing-32x8', sku: 'FTH-WNG-32X8', price: 19900, rrp: 24900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/feather,wing,neopixel', desc: '32x8 NeoPixel FeatherWing for Adafruit Feather boards, 256 pixels.', tags: ["neopixel", "feather"] },
    { title: 'NeoPixel LED Diffuser Tubes 10pcs', handle: 'np-diffuser-tubes', sku: 'NP-DIFF-TUBE10', price: 1500, rrp: 1900, stock: 200, imgUrl: 'https://loremflickr.com/600/600/neopixel,diffuser,tube', desc: '10 pack frosted diffuser tubes 5mm for individual NeoPixel LEDs.', tags: ["neopixel", "diffuser"] },
    { title: 'Digital 5050 RGB LED Module KY-009', handle: 'ky009-rgb-module', sku: 'KY009-RGB', price: 600, rrp: 800, stock: 200, imgUrl: 'https://loremflickr.com/600/600/rgb,5050,module', desc: 'KY-009 5050 full-color RGB LED SMD module for Arduino.', tags: ["neopixel", "rgb"] },
    { title: 'WS2812B LED Disc 7 Pixel', handle: 'ws2812b-disc-7px', sku: 'WS2812B-DISC-7', price: 3200, rrp: 3900, stock: 60, imgUrl: 'https://loremflickr.com/600/600/neopixel,disc,7', desc: '7-pixel WS2812B NeoPixel disc, 40mm diameter on black PCB.', tags: ["neopixel", "disc"] },
    { title: 'NeoPixel Shield 40 LEDs 5x8', handle: 'np-shield-40-5x8', sku: 'NP-SHLD-5X8', price: 8900, rrp: 10900, stock: 25, imgUrl: 'https://loremflickr.com/600/600/neopixel,shield,arduino', desc: 'Arduino shield with 40 NeoPixels in a 5x8 grid, stacking headers.', tags: ["neopixel", "shield"] },
    { title: 'Addressable LED Coin WS2812B 8mm', handle: 'ws2812b-coin-8mm', sku: 'WS2812B-COIN', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/neopixel,coin,pixel', desc: '8mm round WS2812B NeoPixel coin pixel module with flat leads.', tags: ["neopixel", "coin"] },
    { title: 'NeoPixel Triangle Star 43 LEDs', handle: 'np-triangle-43', sku: 'NP-TRI-43', price: 11900, rrp: 14900, stock: 15, imgUrl: 'https://loremflickr.com/600/600/neopixel,triangle,art', desc: '43 WS2812B NeoPixels arranged in a triangle pattern on rigid PCB.', tags: ["neopixel", "triangle"] },
    { title: 'LPD8806 RGB LED Strip 1m 32 LEDs', handle: 'lpd8806-strip-1m-32', sku: 'LPD8806-1M-32', price: 5900, rrp: 7200, stock: 30, imgUrl: 'https://loremflickr.com/600/600/lpd8806,spi,strip', desc: 'LPD8806 SPI RGB LED strip 32 LEDs/m, 1m, for high-speed control.', tags: ["neopixel", "lpd8806"] },
    { title: 'NeoPixel Ball 12 WS2812B Diffused', handle: 'np-ball-12-diff', sku: 'NP-BALL-12', price: 5500, rrp: 6800, stock: 30, imgUrl: 'https://loremflickr.com/600/600/neopixel,ball,dome', desc: '12 WS2812B NeoPixels diffused on a dome shape for light sculpture.', tags: ["neopixel", "ball"] },
    { title: 'TM1814 RGBW Pixel Node String 50px', handle: 'tm1814-50px-string', sku: 'TM1814-50PX', price: 12900, rrp: 15900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/pixel,node,string', desc: 'TM1814 RGBW 50-pixel string with transparent bullet lenses.', tags: ["neopixel", "rgbw"] },
    { title: 'WS2811 100px Diffused Pixel Strip 5V', handle: 'ws2811-100px-diff', sku: 'WS2811-100-DIFF', price: 14900, rrp: 18500, stock: 15, imgUrl: 'https://loremflickr.com/600/600/ws2811,pixel,holiday', desc: '100-pixel diffused bullet WS2811 string lights for holidays.', tags: ["neopixel", "ws2811"] },
    { title: 'NeoPixel Breadboard Strip 5px', handle: 'np-breadboard-5px', sku: 'NP-BB-5PX', price: 1900, rrp: 2400, stock: 150, imgUrl: 'https://loremflickr.com/600/600/neopixel,breadboard,prototype', desc: '5 WS2812B NeoPixels on a breadboard-compatible strip.', tags: ["neopixel", "breadboard"] },
    { title: 'RGB LED Shim HAT Raspberry Pi Zero', handle: 'rgb-shim-rpi-zero', sku: 'RGB-SHIM-RPIZ', price: 7900, rrp: 9800, stock: 20, imgUrl: 'https://loremflickr.com/600/600/neopixel,raspberry,pi', desc: 'Pimoroni RGB LED Shim for Raspberry Pi Zero with 28 NeoPixels.', tags: ["neopixel", "raspberry-pi"] },
    { title: 'Unicorn Hat HD 16x16 RGB Pi', handle: 'unicorn-hat-hd', sku: 'UNICORN-HD', price: 39900, rrp: 49900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/unicorn,hat,neopixel', desc: 'Unicorn Hat HD: 256 RGB NeoPixels 16x16 for Raspberry Pi.', tags: ["neopixel", "raspberry-pi"] },
    { title: 'NeoPixel Cube 5x5x5 WS2812B Kit', handle: 'np-cube-5x5x5', sku: 'NP-CUBE-5X5', price: 34900, rrp: 42900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/neopixel,cube,3d', desc: '125 WS2812B NeoPixels 5x5x5 3D cube kit with STM32 controller.', tags: ["neopixel", "cube"] },
    { title: 'Flexible NeoPixel Matrix 8x8 Silicone', handle: 'np-flex-matrix-8x8', sku: 'NP-FLEX-8X8', price: 22900, rrp: 28500, stock: 12, imgUrl: 'https://loremflickr.com/600/600/neopixel,flexible,matrix', desc: 'Flexible 8x8 WS2812B NeoPixel matrix panel on silicone PCB.', tags: ["neopixel", "flexible"] },
    { title: 'Blinkt 8 APA102 LEDs Hat for RPi', handle: 'blinkt-apa102-rpi', sku: 'BLINKT-APA102', price: 8900, rrp: 10900, stock: 20, imgUrl: 'https://loremflickr.com/600/600/blinkt,apa102,hat', desc: 'Pimoroni Blinkt: 8 APA102 DotStar LEDs on Raspberry Pi GPIO hat.', tags: ["neopixel", "apa102"] },
    { title: 'Color Chase LED Kit 10 NeoPixels', handle: 'color-chase-kit', sku: 'CLR-CHASE-10', price: 3500, rrp: 4200, stock: 50, imgUrl: 'https://loremflickr.com/600/600/neopixel,animation,kit', desc: '10 NeoPixel standalone color-chase animation kit with ATtiny85.', tags: ["neopixel", "kit"] },
    { title: 'NeoPixel Fairy Light 30px USB 2m', handle: 'np-fairy-30px-2m', sku: 'NP-FAIRY-30-2M', price: 8900, rrp: 10900, stock: 30, imgUrl: 'https://loremflickr.com/600/600/fairy,light,neopixel', desc: 'USB 5V WS2812B 30-pixel copper wire fairy lights 2m for decoration.', tags: ["neopixel", "fairy"] },
    { title: 'WLED WiFi NeoPixel Controller', handle: 'wled-wifi-np-ctrl', sku: 'WLED-CTRL-01', price: 14900, rrp: 18500, stock: 20, imgUrl: 'https://loremflickr.com/600/600/wled,wifi,controller', desc: 'WLED pre-flashed ESP8266 NeoPixel controller with 100+ effects.', tags: ["neopixel", "wled"] },
    { title: 'QuinLED WiFi LED Controller PCB', handle: 'quinled-wifi-pcb', sku: 'QUINLED-PCB', price: 19900, rrp: 24900, stock: 12, imgUrl: 'https://loremflickr.com/600/600/quinled,led,controller', desc: 'QuinLED-Dig-Uno ESP8266 PCB for WLED digital LED control.', tags: ["neopixel", "controller"] },
    { title: 'NeoPixel Wristband 7 WS2812B Kit', handle: 'np-wristband-7', sku: 'NP-WRIST-7', price: 7900, rrp: 9800, stock: 20, imgUrl: 'https://loremflickr.com/600/600/neopixel,wristband,wearable', desc: '7 NeoPixel wearable wristband kit with elastic strap and FLORA board.', tags: ["neopixel", "wearable"] },
    { title: 'DotStar APA102 72 LEDs Disk', handle: 'dotstar-apa102-72', sku: 'DST-APA102-72', price: 24900, rrp: 30900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/dotstar,apa102,disk', desc: 'APA102 72-pixel DotStar LED disk for high-speed animations.', tags: ["neopixel", "apa102"] },
    { title: 'NeoPixel LED Goggle Ring 32 Pixels', handle: 'np-goggle-ring-32', sku: 'NP-GOGL-32', price: 14900, rrp: 18500, stock: 10, imgUrl: 'https://loremflickr.com/600/600/neopixel,goggle,wearable', desc: 'Dual 16-pixel NeoPixel ring goggles with wide-angle diffused WS2812B.', tags: ["neopixel", "goggle"] },
    { title: 'SK9822 APA102 Clone Strip 1m', handle: 'sk9822-strip-1m', sku: 'SK9822-1M-60', price: 6200, rrp: 7600, stock: 40, imgUrl: 'https://loremflickr.com/600/600/sk9822,spi,strip', desc: 'SK9822 compatible high-speed SPI LED strip, 60 px/m, 1m.', tags: ["neopixel", "sk9822"] },
    { title: 'NeoPixel Wand Kit with SAMD21', handle: 'ttago-np-wand', sku: 'TTAGO-WAND', price: 12900, rrp: 15900, stock: 12, imgUrl: 'https://loremflickr.com/600/600/neopixel,wand,magic', desc: 'Magic wand kit with 16 NeoPixels and SAMD21 microcontroller.', tags: ["neopixel", "wand"] },
    { title: 'Neon LED Silicone Strip RGBW 1m', handle: 'neon-led-rgbw-1m', sku: 'NEON-RGBW-1M', price: 9900, rrp: 12500, stock: 25, imgUrl: 'https://loremflickr.com/600/600/neon,silicone,rgbw', desc: 'Flexible silicone RGBW LED neon strip compatible with WS2812 control.', tags: ["neopixel", "neon"] },
    { title: 'NeoPixel Architecture Globe 60px', handle: 'np-globe-60-diff', sku: 'NP-GLOBE-60', price: 19900, rrp: 24900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/neopixel,globe,sculpture', desc: 'Globe-shaped 60-pixel diffused WS2812B NeoPixel art installation piece.', tags: ["neopixel", "globe"] },
    { title: 'LED Pixel Art Board Kit 16x16', handle: 'pixel-art-16x16-kit', sku: 'PIXART-16X16', price: 29900, rrp: 36900, stock: 10, imgUrl: 'https://loremflickr.com/600/600/pixel,art,led', desc: '16x16 acrylic LED pixel art board kit with 256 WS2812B and frame.', tags: ["neopixel", "pixel-art"] },
    { title: 'NeoPixel Strip Extension Cable 1m', handle: 'np-ext-cable-1m', sku: 'NP-EXT-CBL-1M', price: 1200, rrp: 1600, stock: 200, imgUrl: 'https://loremflickr.com/600/600/led,strip,cable', desc: '3-wire extension cable for NeoPixel strips, JST-SM 3-pin, 1m.', tags: ["neopixel", "cable"] },
    { title: 'JST SM 3-Pin Connector Set 10pcs', handle: 'jst-sm-3pin-10pcs', sku: 'JST-SM-3P-10', price: 900, rrp: 1200, stock: 300, imgUrl: 'https://loremflickr.com/600/600/jst,connector,led', desc: '10-pair JST SM 3-pin male/female connectors for LED strips.', tags: ["neopixel", "connector"] },
    { title: 'Power Injection Clip for LED Strip', handle: 'power-inject-clip', sku: 'PWR-INJ-CLIP', price: 600, rrp: 800, stock: 400, imgUrl: 'https://loremflickr.com/600/600/power,injection,led', desc: 'Solderless power injection clip for 10mm LED strips, pack of 5.', tags: ["neopixel", "power"] },
    { title: 'E1.31 sACN LED Pixel Controller', handle: 'pixel-ctrl-e131', sku: 'PIXCTRL-E131', price: 24900, rrp: 30900, stock: 8, imgUrl: 'https://loremflickr.com/600/600/pixel,controller,professional', desc: 'E1.31 sACN/Art-Net LED pixel controller, 4 output channels.', tags: ["neopixel", "controller"] },
    { title: 'NeoPixel Extension Cable 20cm', handle: 'np-ext-cable-20cm', sku: 'NP-EXT-20CM', price: 600, rrp: 800, stock: 500, imgUrl: 'https://loremflickr.com/600/600/neopixel,cable,extension', desc: '20cm 3-pin extension cable for connecting NeoPixel modules.', tags: ["neopixel", "cable"] },
    { title: 'Pixie 2-Pin Chainable WS2812', handle: 'pixie-2pin-chain', sku: 'PIXIE-2PIN', price: 2500, rrp: 3200, stock: 60, imgUrl: 'https://loremflickr.com/600/600/neopixel,chainable,pixel', desc: 'Pixie 2-pin chainable NeoPixel-compatible individual LED pixel.', tags: ["neopixel", "chainable"] },
];

async function seed() {
    console.log("Seeding database...");

    // Regions
    const existingRegion = await db.select().from(regions).where(eq(regions.id, "reg_ro")).limit(1);
    if (existingRegion.length === 0) {
        await db.insert(regions).values({ id: "reg_ro", name: "Romania", currencyCode: "RON", taxRate: "0.1900" }).onConflictDoNothing();
    }
    const allCountries = getAllCountriesForSeed();
    for (const country of allCountries) {
        await db.insert(regionCountries).values({
            regionId: "reg_ro",
            iso2: country.iso2,
            iso3: null,
            name: country.name,
            displayName: country.name,
        }).onConflictDoNothing();
    }

    // Shipping options (required by checkout delivery step)
    await db.insert(shippingOptions).values([
        {
            id: "so_standard_30_ron",
            name: "Standard Delivery",
            regionId: "reg_ro",
            priceType: "flat_rate",
            amount: 3000,
            currencyCode: "RON",
            isReturn: false,
            metadata: { courierGroup: "default" },
        },
        {
            id: "so_pickup_free",
            name: "Store Pickup",
            regionId: "reg_ro",
            priceType: "flat_rate",
            amount: 0,
            currencyCode: "RON",
            isReturn: false,
            metadata: { type: "pickup" },
        },
    ]).onConflictDoNothing();

    // Payment providers required by checkout payment step
    await db.insert(paymentProviders).values([
        {
            id: "pp_stripe_stripe",
            name: "Stripe",
            isInstalled: true,
            metadata: {},
        },
        {
            id: "base-crypto",
            name: "Base Crypto",
            isInstalled: true,
            metadata: { network: "base-sepolia", mvp: true },
        },
    ]).onConflictDoNothing();

    // Sales Channel
    const existingChannel = await db.select().from(salesChannels).where(eq(salesChannels.id, "sc_default")).limit(1);
    if (existingChannel.length === 0) {
        await db.insert(salesChannels).values({ id: "sc_default", name: "Default Channel", description: "Default sales channel" }).onConflictDoNothing();
    }

    // Brands — upsert by handle
    const brandHandles = ["adafruit", "generic"];
    const brandDefaults: Record<string, { id: string; name: string }> = {
        "adafruit": { id: "brand_adafruit", name: "Adafruit" },
        "generic":  { id: "brand_generic",  name: "Generic" },
    };
    const brandIdMap: Record<string, string> = {};
    for (const handle of brandHandles) {
        const def = brandDefaults[handle];
        const rows = await db.select({ id: brands.id }).from(brands).where(eq(brands.handle, handle)).limit(1);
        if (rows.length > 0) {
            brandIdMap[handle] = rows[0].id;
        } else {
            await db.insert(brands).values({ id: def.id, name: def.name, handle, isActive: true }).onConflictDoNothing();
            brandIdMap[handle] = def.id;
        }
    }

    // Categories — resolve IDs by handle
    const catHandles = ["electronics", "home-garden", "sensors", "leds", "neopixels"];
    const catDefaults: Record<string, { id: string; name: string; description: string }> = {
        "electronics":  { id: "cat_electronics",  name: "Electronics",  description: "Microcontrollers, dev boards, modules and components" },
        "home-garden":  { id: "cat_home_garden",  name: "Home & Garden", description: "Smart home and garden automation" },
        "sensors":      { id: "cat_sensors",      name: "Sensors",       description: "Environmental, motion, chemical and specialty sensors" },
        "leds":         { id: "cat_leds",         name: "LEDs",          description: "LED components, strips and lighting" },
        "neopixels":    { id: "cat_neopixels",    name: "NeoPixels",     description: "Addressable WS2812B / APA102 NeoPixel products" },
    };
    const catIdMap: Record<string, string> = {};
    for (const handle of catHandles) {
        const def = catDefaults[handle];
        const rows = await db.select({ id: categories.id }).from(categories).where(eq(categories.handle, handle)).limit(1);
        if (rows.length > 0) {
            catIdMap[handle] = rows[0].id;
        } else {
            await db.insert(categories).values({ id: def.id, name: def.name, handle, isActive: true, description: def.description }).onConflictDoNothing();
            catIdMap[handle] = def.id;
        }
    }
    console.log("Category IDs resolved:", catIdMap);

    // Products helper
    type ProductRow = { title: string; handle: string; sku: string; price: number; rrp: number; stock: number; imgUrl: string; desc: string; tags: string[] };

    async function upsertProducts(list: ProductRow[], categoryId: string, brandId: string) {
        console.log(`  Seeding ${list.length} products into category ${categoryId}...`);
        for (const p of list) {
            const existing = await db.select({ id: products.id }).from(products).where(eq(products.handle, p.handle)).limit(1);
            if (existing.length > 0) {
                await db.update(products).set({ thumbnail: p.imgUrl, images: [p.imgUrl] }).where(eq(products.handle, p.handle));
                continue;
            }
            const pid = "prod_" + nanoid();
            await db.insert(products).values({
                id: pid, title: p.title, handle: p.handle, description: p.desc,
                status: "published", categoryId, brandId,
                rrpPrice: p.rrp, thumbnail: p.imgUrl, images: [p.imgUrl], tags: p.tags,
            });
            await db.insert(productVariants).values({
                id: "var_" + nanoid(), title: "Standard", productId: pid,
                price: p.price, inventoryQuantity: p.stock, manageInventory: true,
                currencyCode: "RON", sku: p.sku,
            });
        }
    }

    await upsertProducts(ELECTRONICS, catIdMap["electronics"], brandIdMap["generic"]);
    await upsertProducts(HOME_GARDEN, catIdMap["home-garden"], brandIdMap["generic"]);
    await upsertProducts(SENSORS, catIdMap["sensors"], brandIdMap["adafruit"]);
    await upsertProducts(LEDS, catIdMap["leds"], brandIdMap["adafruit"]);
    await upsertProducts(NEOPIXELS, catIdMap["neopixels"], brandIdMap["adafruit"]);

    console.log("Seeding complete.");
    await closeDatabase();
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
