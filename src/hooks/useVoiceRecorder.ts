'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);

  // v7.0-test12: 同步ref避免闭包引用陈旧状态
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // v7.0-test12: 组件卸载时停止语音识别，防止内存泄漏
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    setError('');
    if (typeof window === 'undefined' || !(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setError('您的浏览器不支持语音输入功能');
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition!;
    recognitionRef.current = new SpeechRecognitionCtor();
    recognitionRef.current.lang = 'zh-CN';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognitionRef.current.onend = () => {
      // 使用ref而非闭包变量，确保获取最新状态
      if (isRecordingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}
