import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

interface DeviceData {
  id: number;
  rawText: string;
  gtin: string;
  serialNumber: string;
  lotNumber: string;
  expiryDate: string;
  dateSaved: string;
}

export default function ScannerPlayground() {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [scannedDevices, setScannedDevices] = useState<DeviceData[]>(() => {
    const saved = localStorage.getItem('medlabel_saved_devices');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. معالجة الصورة واستخراج النصوص (OCR)
  const processImageOCR = async (imageFile: File) => {
    setLoading(true);
    setStatusText('جاري قراءة الملصق ضوئياً والتعرف على النصوص...');
    
    try {
      const worker = await createWorker('eng'); 
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();

      setStatusText('جاري تحليل أكواد الـ UDI وحفظ البيانات...');
      parseAndSaveDevice(text);
    } catch (error) {
      console.error('خطأ في قراءة الصورة:', error);
      setStatusText('فشلت قراءة الملصق، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // 2. دالة تحليل الأكواد (UDI Parser) واستخراج البيانات تلقائياً
  const parseAndSaveDevice = (rawText: string) => {
    // التقاط الرموز القياسية للأجهزة الطبية المعترف بها عالمياً
    const gtinMatch = rawText.match(/\(01\)(\d{14})/) || rawText.match(/GTIN[:\s](\d{14})/);
    const snMatch = rawText.match(/\(21\)([A-Za-z0-9]+)/) || rawText.match(/SN[:\s]([A-Za-z0-9]+)/);
    const lotMatch = rawText.match(/\(10\)([A-Za-z0-9]+)/) || rawText.match(/LOT[:\s]([A-Za-z0-9]+)/);
    const expMatch = rawText.match(/\(17\)(\d{6})/) || rawText.match(/EXP[:\s](\d{2}[-/]\d{2}[-/]\d{2,4})/);

    const newDevice: DeviceData = {
      id: Date.now(),
      rawText: rawText,
      gtin: gtinMatch ? gtinMatch[1] : 'غير مكتشف',
      serialNumber: snMatch ? snMatch[1] : 'غير مكتشف',
      lotNumber: lotMatch ? lotMatch[1] : 'غير مكتشف',
      expiryDate: expMatch ? expMatch[1] : 'غير مكتشف',
      dateSaved: new Date().toLocaleString('ar-SA'),
    };

    // 3. الحفظ التلقائي الإجباري في ذاكرة الجوال المحلية (Local Storage)
    const updatedList = [newDevice, ...scannedDevices];
    setScannedDevices(updatedList);
    localStorage.setItem('medlabel_saved_devices', JSON.stringify(updatedList));
    setStatusText('تم حفظ معلومات الجهاز تلقائياً في السجل بنجاح! 🎉');
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processImageOCR(event.target.files[0]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', color: '#fff', background: '#0b1329', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', color: '#4cc9f0' }}>الماسح الذكي لقراءة وحفظ الأجهزة</h2>
      
      {/* زر تشغيل كاميرا الجوال للاندرويد مباشرة */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <label style={{
          backgroundColor: '#4cc9f0', color: '#0b1329', padding: '15px 30px',
          borderRadius: '30px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(76, 201, 240, 0.4)'
        }}>
          📷 تصوير ملصق الجهاز وحفظه فورا
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleCameraCapture} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {statusText && (
        <p style={{ textAlign: 'center', fontWeight: 'bold', color: loading ? '#ffb703' : '#06d6a0', padding: '10px' }}>
          {statusText}
        </p>
      )}

      {/* عرض القائمة الإجمالية للأجهزة المحفوظة تلقائياً في ذاكرة الجوال */}
      <h3 style={{ borderBottom: '2px solid #1e293b', paddingBottom: '10px', color: '#4cc9f0' }}>📋 الأجهزة المحفوظة تلقائياً ({scannedDevices.length})</h3>
      <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '15px' }}>
        {scannedDevices.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>لا توجد أجهزة محفوظة حتى الآن. اضغط على الزر بالأعلى لتصوير أول جهاز.</p>
        ) : (
          scannedDevices.map((device) => (
            <div key={device.id} style={{
              background: '#1c2541', padding: '15px', borderRadius: '12px',
              marginBottom: '15px', borderRight: '5px solid #4cc9f0', boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}><strong>📅 وقت الحفظ:</strong> {device.dateSaved}</p>
              <p><strong>🔢 كود الـ GTIN (01):</strong> <span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>{device.gtin}</span></p>
              <p><strong>🏷️ الرقم التسلسلي SN (21):</strong> {device.serialNumber}</p>
              <p><strong>📦 رقم التشغيلة LOT (10):</strong> {device.lotNumber}</p>
              <p><strong>⏳ تاريخ الانتهاء EXP (17):</strong> {device.expiryDate}</p>
              <details style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                <summary style={{ cursor: 'pointer', color: '#4cc9f0' }}>عرض النص المكتوب الكامل المستخرج</summary>
                <p style={{ whiteSpace: 'pre-wrap', background: '#0b1329', padding: '10px', borderRadius: '6px', marginTop: '5px', color: '#fff' }}>{device.rawText}</p>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
