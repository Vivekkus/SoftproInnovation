const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');
const Product = require('../models/Product');

const seedStore = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully for store seeding...');

    // 1. Define Popular Categories
    const categoriesData = [
      {
        category: 'Single Board Computers',
        description: 'Raspberry Pi boards, compute modules, and high-performance maker mini-PCs.',
        picture: 'uploads/category/1772083963790_Raspberry Pi 4 Model B .png',
        status: 'active'
      },
      {
        category: 'Microcontrollers & Dev Boards',
        description: 'Arduino UNO, Nano, ESP32, STM32, and RP2040 programmable development boards.',
        picture: 'uploads/category/1780135480834_microcontrollers.jpg',
        status: 'active'
      },
      {
        category: 'Sensors & Measurement',
        description: 'Temperature, humidity, environmental gas, inertial motion, and optical sensor modules.',
        picture: 'uploads/category/1772125374747_MPU6050.png',
        status: 'active'
      },
      {
        category: 'Displays & Optoelectronics',
        description: 'OLED displays, 7-segment LED counters, TFT LCDs, and light-sensing photodetectors.',
        picture: 'uploads/category/1773724561610_7-Segment Displays  .png',
        status: 'active'
      },
      {
        category: 'Robotics & DIY Components',
        description: 'Motors, servo drivers, relays, chassis kits, and prototyping hardware.',
        picture: 'uploads/category/1772125323424_LDR.png',
        status: 'active'
      }
    ];

    const categoryMap = {};

    for (const catData of categoriesData) {
      let existing = await Category.findOne({ category: catData.category });
      if (!existing) {
        existing = await Category.create(catData);
        console.log(`Created Category: ${existing.category}`);
      } else {
        existing.picture = catData.picture;
        existing.status = 'active';
        existing.description = catData.description;
        await existing.save();
        console.log(`Updated Category: ${existing.category}`);
      }
      categoryMap[catData.category] = existing._id;
    }

    // 2. Define Featured Products
    const productsData = [
      {
        name: 'Raspberry Pi 4 Model B (8GB RAM)',
        category: categoryMap['Single Board Computers'],
        brandName: 'Raspberry Pi Foundation',
        actualPrice: '7499',
        discount: '10',
        images: 'uploads/product/1772000839005_Raspberry Pi 4 Model B .png',
        tag: 'Featured',
        stock: '85',
        stockStatus: 'inStock',
        attributes: 'Quad-core Cortex-A72 @ 1.5GHz, 8GB LPDDR4, Dual 4K Micro-HDMI, Gigabit Ethernet',
        height: '85mm',
        width: '56mm',
        description: 'The Raspberry Pi 4 Model B is the high-performance computing board for robotics, AI vision, retro gaming, and edge servers with dual display support.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'Yes',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'Arduino UNO R3 SMD Development Board',
        category: categoryMap['Microcontrollers & Dev Boards'],
        brandName: 'Arduino',
        actualPrice: '699',
        discount: '15',
        images: 'uploads/product/1773724383366_UNO R3 SMD Board .png',
        tag: 'Popular',
        stock: '150',
        stockStatus: 'inStock',
        attributes: 'ATmega328P Microcontroller, 16MHz Clock, 14 Digital I/O Pins, 6 Analog Inputs',
        height: '68.6mm',
        width: '53.4mm',
        description: 'The classic Arduino Uno SMD board ideal for electronics beginners, students, and engineers creating robotics and automated smart control prototypes.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'Yes',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'DHT22 Digital Temperature & Humidity Sensor',
        category: categoryMap['Sensors & Measurement'],
        brandName: 'Aosong',
        actualPrice: '399',
        discount: '20',
        images: 'uploads/product/1773033873400_DHT22.png',
        tag: 'Featured',
        stock: '200',
        stockStatus: 'inStock',
        attributes: '-40 to 80°C Temp Range, 0-100% Humidity, ±0.5°C Accuracy, 1-wire digital output',
        height: '28mm',
        width: '15mm',
        description: 'High precision calibrated digital temperature and humidity sensor module for smart weather stations, IoT greenhouse automation, and HVAC monitors.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'Yes',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'MQ-2 Gas / Combustible Smoke Sensor Module',
        category: categoryMap['Sensors & Measurement'],
        brandName: 'Waveshare',
        actualPrice: '249',
        discount: '10',
        images: 'uploads/product/1773294041676_MQ-2 .png',
        tag: 'Popular',
        stock: '120',
        stockStatus: 'inStock',
        attributes: 'Detects LPG, Propane, Methane, Hydrogen, Smoke, 5V DC Operating Voltage, Dual Analog/Digital Output',
        height: '32mm',
        width: '20mm',
        description: 'Fast-response gas detector sensor with onboard comparator potentiometer for gas leak alarms and industrial safety monitoring.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'No',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'DS18B20 Waterproof Temperature Sensor Probe',
        category: categoryMap['Sensors & Measurement'],
        brandName: 'Dallas Semiconductor',
        actualPrice: '299',
        discount: '12',
        images: 'uploads/product/1773640445067_DS18B20 .png',
        tag: 'Best Seller',
        stock: '95',
        stockStatus: 'inStock',
        attributes: '1m Stainless Steel Probe, 9 to 12-bit Selectable Resolution, 1-Wire Communication Bus',
        height: '1000mm',
        width: '6mm',
        description: 'Stainless steel encased waterproof digital thermal probe ideal for liquid immersion, soil temperature measurement, and aquarium monitoring.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'No',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'Raspberry Pi 3 Model B+ (1GB RAM)',
        category: categoryMap['Single Board Computers'],
        brandName: 'Raspberry Pi Foundation',
        actualPrice: '4299',
        discount: '10',
        images: 'uploads/product/1772001094340_Raspberry Pi 3 Model B .png',
        tag: 'Featured',
        stock: '45',
        stockStatus: 'inStock',
        attributes: '1.4GHz 64-bit Quad-Core ARM Cortex-A53, Dual-band 2.4/5GHz Wireless LAN, Bluetooth 4.2',
        height: '85mm',
        width: '56mm',
        description: 'The proven Raspberry Pi 3 Model B+ providing reliable compute power for home media centers, DIY network firewalls, and embedded controls.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'Yes',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'KY-038 High Sensitivity Sound Sensor Module',
        category: categoryMap['Sensors & Measurement'],
        brandName: 'Keyes',
        actualPrice: '179',
        discount: '15',
        images: 'uploads/product/1773036715546_KY-038 .png',
        tag: 'New Arrival',
        stock: '160',
        stockStatus: 'inStock',
        attributes: 'Electret Condenser Microphone, LM393 Comparator, Adjustable Sensitivity, Digital & Analog Output',
        height: '35mm',
        width: '15mm',
        description: 'Acoustic sound wave detection module capable of triggering events upon claps, knocks, or ambient noise threshold triggers.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'No',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      },
      {
        name: 'Raspberry Pi Official Camera Module V2 (8MP)',
        category: categoryMap['Single Board Computers'],
        brandName: 'Sony / Raspberry Pi',
        actualPrice: '2499',
        discount: '10',
        images: 'uploads/product/1780136179740_respberry.jpg',
        tag: 'Featured',
        stock: '60',
        stockStatus: 'inStock',
        attributes: 'Sony IMX219 8-Megapixel Sensor, 1080p30 / 720p60 Video, Dedicated CSI Ribbon Interface',
        height: '25mm',
        width: '24mm',
        description: 'High-definition 8MP image and video sensor module for computer vision, object tracking, surveillance security, and OpenCV machine learning projects.',
        refundPolicy: 'Yes',
        replacementPolicy: 'Yes',
        freeDelivery: 'Yes',
        returnPolicy: 'Yes',
        isCod: 'Yes',
        status: 'active'
      }
    ];

    for (const prodData of productsData) {
      let existing = await Product.findOne({ name: prodData.name });
      if (!existing) {
        existing = await Product.create(prodData);
        console.log(`Created Product: ${existing.name}`);
      } else {
        Object.assign(existing, prodData);
        await existing.save();
        console.log(`Updated Product: ${existing.name}`);
      }
    }

    console.log('\n✅ Successfully seeded Popular Categories and Featured Products!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedStore();
