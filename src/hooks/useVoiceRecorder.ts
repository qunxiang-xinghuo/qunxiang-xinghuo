'use client';

import { useState, useRef, useCallback } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      if (isRecording) {
        recognitionRef.current?.start();
      }
    };

    recognitionRef.current.start();
    setIsRecording(true);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
