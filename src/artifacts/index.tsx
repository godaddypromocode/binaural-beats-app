import { useState } from 'react';
import { Brain, Moon, Focus, Heart, Zap, Palette, Volume2, Play, Pause } from 'lucide-react';

type Config = {
  carrierFreq: number;
  binauralBeat: number;
  sessionDuration: number;
};

type Oscillators = {
  left: OscillatorNode;
  right: OscillatorNode;
  leftGain: GainNode;
  rightGain: GainNode;
} | null;

const BinauralBeatsWizard = () => {
  const [selectedEffect, setSelectedEffect] = useState<string>('relaxation');
 
  const [config, setConfig] = useState<Config>({
    carrierFreq: 220,
    binauralBeat: 10,
    sessionDuration: 20
  });
  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [binauralVolume, setBinauralVolume] = useState<number>(0.7);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillators, setOscillators] = useState<Oscillators>(null);
 
  // Timer state
  const [sessionTime, setSessionTime] = useState<number>(20);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const effects = [
    {
      id: 'relaxation',
      title: 'Relax',
      subtitle: 'Release tension',
      icon: Heart,
      color: '#10b981',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      frequency: '8-12 Hz Alpha',
      defaultCarrier: 220,
      defaultBeat: 10,
      beatRange: [8, 12]
    },
    {
      id: 'focus',
      title: 'Focus',
      subtitle: 'Deep concentration',
      icon: Focus,
      color: '#3b82f6',
      bgGradient: 'from-blue-500/10 to-indigo-500/5',
      frequency: '15-20 Hz Beta',
      defaultCarrier: 180,
      defaultBeat: 16,
      beatRange: [15, 20]
    },
    {
      id: 'sleep',
      title: 'Sleep',
      subtitle: 'Restorative rest',
      icon: Moon,
      color: '#8b5cf6',
      bgGradient: 'from-purple-500/10 to-indigo-500/5',
      frequency: '1-4 Hz Delta',
      defaultCarrier: 100,
      defaultBeat: 2,
      beatRange: [1, 4]
    },
    {
      id: 'meditation',
      title: 'Meditate',
      subtitle: 'Mindful states',
      icon: Brain,
      color: '#f59e0b',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      frequency: '4-8 Hz Theta',
      defaultCarrier: 150,
      defaultBeat: 6,
      beatRange: [4, 8]
    },
    {
      id: 'energy',
      title: 'Energize',
      subtitle: 'Mental clarity',
      icon: Zap,
      color: '#ef4444',
      bgGradient: 'from-red-500/10 to-pink-500/5',
      frequency: '25-30 Hz Beta',
      defaultCarrier: 200,
      defaultBeat: 27,
      beatRange: [25, 30]
    },
    {
      id: 'creativity',
      title: 'Create',
      subtitle: 'Unlock flow',
      icon: Palette,
      color: '#a855f7',
      bgGradient: 'from-violet-500/10 to-purple-500/5',
      frequency: '6-8 Hz Theta',
      defaultCarrier: 160,
      defaultBeat: 7,
      beatRange: [6, 8]
    }
  ];
  const selectedEffectData = effects.find(e => e.id === selectedEffect);
  const updateConfig = (key: keyof Config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const startTimer = () => {
    const totalSeconds = sessionTime * 60;
    setTimeRemaining(totalSeconds);
   
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopAudio();
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
   
    setTimerInterval(interval);
  };
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimeRemaining(0);
  };
  const pauseAudio = () => {
    if (oscillators && oscillators.leftGain && oscillators.rightGain && !isPaused) {
      oscillators.leftGain.gain.setValueAtTime(0, audioContext?.currentTime ?? 0);
      oscillators.rightGain.gain.setValueAtTime(0, audioContext?.currentTime ?? 0);
      setIsPaused(true);
     
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };
  const resumeAudio = () => {
    if (oscillators && oscillators.leftGain && oscillators.rightGain && isPaused) {
      oscillators.leftGain.gain.setValueAtTime(binauralVolume * 0.3, audioContext?.currentTime ?? 0);
      oscillators.rightGain.gain.setValueAtTime(binauralVolume * 0.3, audioContext?.currentTime ?? 0);
      setIsPaused(false);
     
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopAudio();
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
     
      setTimerInterval(interval);
    }
  };
  const togglePlayPause = () => {
    if (!isPlaying) {
      startAudio();
    } else if (isPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  };
  const startAudio = () => {
    try {
      const Context = window.AudioContext || (window as any).webkitAudioContext;
      const context = new Context();
      if (context.state === 'suspended') {
        context.resume();
      }
      const leftOsc = context.createOscillator();
      const rightOsc = context.createOscillator();
      const leftGain = context.createGain();
      const rightGain = context.createGain();
      const leftPan = context.createStereoPanner();
      const rightPan = context.createStereoPanner();
      leftOsc.type = 'sine';
      rightOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(config.carrierFreq, context.currentTime);
      rightOsc.frequency.setValueAtTime(config.carrierFreq + config.binauralBeat, context.currentTime);
      leftPan.pan.setValueAtTime(-1, context.currentTime);
      rightPan.pan.setValueAtTime(1, context.currentTime);
      leftGain.gain.setValueAtTime(0, context.currentTime);
      rightGain.gain.setValueAtTime(0, context.currentTime);
      leftGain.gain.exponentialRampToValueAtTime(binauralVolume * 0.3, context.currentTime + 1.5);
      rightGain.gain.exponentialRampToValueAtTime(binauralVolume * 0.3, context.currentTime + 1.5);
      leftOsc.connect(leftGain);
      rightOsc.connect(rightGain);
      leftGain.connect(leftPan);
      rightGain.connect(rightPan);
      leftPan.connect(context.destination);
      rightPan.connect(context.destination);
      leftOsc.start();
      rightOsc.start();
      setAudioContext(context);
      setOscillators({ left: leftOsc, right: rightOsc, leftGain, rightGain });
      setIsPlaying(true);
     
      startTimer();
    } catch (error) {
      console.error('Audio error:', error);
      alert('Audio requires headphones to work properly');
    }
  };
  const stopAudio = () => {
    if (oscillators && audioContext) {
      try {
        oscillators.leftGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        oscillators.rightGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
       
        setTimeout(() => {
          if (oscillators) {
            oscillators.left.stop();
            oscillators.right.stop();
            oscillators.left.disconnect();
            oscillators.right.disconnect();
            oscillators.leftGain.disconnect();
            oscillators.rightGain.disconnect();
            setOscillators(null);
          }
          if (audioContext) {
            audioContext.close();
            setAudioContext(null);
          }
        }, 500);
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
   
    setIsPlaying(false);
    setIsPaused(false);
    stopTimer();
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Ultra-minimal header */}
      <div className="pt-16 pb-8 text-center">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-2">
          Binaural
        </h1>
        <p className="text-gray-500 font-light">Choose your focus</p>
      </div>
      <div className="max-w-4xl mx-auto px-6">
        {/* Apple-style effect selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {effects.map((effect) => {
            const Icon = effect.icon;
            const isSelected = selectedEffect === effect.id;
           
            return (
              <div
                key={effect.id}
                className={`group relative cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                onClick={() => {
                  setSelectedEffect(effect.id);
                  setConfig(prev => ({
                    ...prev,
                    carrierFreq: effect.defaultCarrier,
                    binauralBeat: effect.defaultBeat
                  }));
                }}
              >
                <div className={`
                  relative overflow-hidden rounded-2xl p-6 transition-all duration-300
                  ${isSelected
                    ? `bg-gradient-to-br ${effect.bgGradient} border-2 border-gray-200/60 shadow-sm`
                    : 'bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent'
                  }
                `}>
                  {/* Subtle selection indicator */}
                  {isSelected && (
                    <div
                      className="absolute top-4 right-4 w-2 h-2 rounded-full"
                      style={{ backgroundColor: effect.color }}
                    />
                  )}
                 
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-all duration-300"
                      style={{
                        backgroundColor: isSelected ? effect.color : '#f3f4f6',
                        color: isSelected ? 'white' : '#6b7280'
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                   
                    <h3 className="font-medium text-gray-900 mb-1">{effect.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{effect.subtitle}</p>
                    <span className="text-xs text-gray-400 font-mono">{effect.frequency}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Minimal controls */}
        {selectedEffectData && (
          <div className="max-w-md mx-auto">
            {/* Frequency control */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">Frequency</span>
                <span className="text-sm text-gray-500 font-mono">{config.binauralBeat} Hz</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={selectedEffectData.beatRange[0]}
                  max={selectedEffectData.beatRange[1]}
                  step="0.5"
                  value={config.binauralBeat}
                  onChange={(e) => updateConfig('binauralBeat', Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${selectedEffectData.color} 0%, ${selectedEffectData.color} ${((config.binauralBeat - selectedEffectData.beatRange[0]) / (selectedEffectData.beatRange[1] - selectedEffectData.beatRange[0])) * 100}%, #e5e7eb ${((config.binauralBeat - selectedEffectData.beatRange[0]) / (selectedEffectData.beatRange[1] - selectedEffectData.beatRange[0])) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>
            {/* Duration control */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">Duration</span>
                <span className="text-sm text-gray-500">{sessionTime} min</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${selectedEffectData.color} 0%, ${selectedEffectData.color} ${((sessionTime - 5) / 55) * 100}%, #e5e7eb ${((sessionTime - 5) / 55) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>
            {/* Player */}
            <div className="text-center">
              {/* Headphones reminder */}
              {!isPlaying && (
                <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-amber-800 text-sm">
                    🎧 Headphones required for binaural beats
                  </div>
                </div>
              )}
              {/* Main play button */}
              <div className="relative inline-block mb-6">
                <button
                  onClick={togglePlayPause}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center text-white
                    transition-all duration-300 transform hover:scale-105 active:scale-95
                    shadow-lg hover:shadow-xl
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${selectedEffectData.color}, ${selectedEffectData.color}dd)`
                  }}
                >
                  {isPlaying && !isPaused ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>
               
                {/* Elegant progress ring */}
                {isPlaying && timeRemaining > 0 && (
                  <svg className="absolute top-0 left-0 w-20 h-20 transform -rotate-90 pointer-events-none" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="#f3f4f6" strokeWidth="2" fill="none"
                    />
                    <circle
                      cx="40" cy="40" r="36"
                      stroke={selectedEffectData.color} strokeWidth="2" fill="none"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 36}`,
                        strokeDashoffset: `${2 * Math.PI * 36 * (1 - (sessionTime * 60 - timeRemaining) / (sessionTime * 60))}`,
                        transition: 'stroke-dashoffset 0.3s ease'
                      }}
                    />
                  </svg>
                )}
              </div>
              {/* Session info */}
              {isPlaying && (
                <div className="space-y-3 mb-8">
                  <div className="text-3xl font-light text-gray-900">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isPaused ? 'Paused' : selectedEffectData.title}
                  </div>
                </div>
              )}
              {/* Volume control */}
              <div className="flex items-center gap-4 justify-center mb-8">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <div className="w-32">
                  <input
                    type="range" min="0" max="1" step="0.1" value={binauralVolume}
                    onChange={(e) => {
                      const newVolume = Number(e.target.value);
                      setBinauralVolume(newVolume);
                      if (oscillators?.leftGain && oscillators?.rightGain) {
                        try {
                          oscillators.leftGain.gain.setValueAtTime(newVolume * 0.3, audioContext?.currentTime ?? 0);
                          oscillators.rightGain.gain.setValueAtTime(newVolume * 0.3, audioContext?.currentTime ?? 0);
                        } catch (error) {
                          console.error('Volume error:', error);
                        }
                      }
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${selectedEffectData.color} 0%, ${selectedEffectData.color} ${binauralVolume * 100}%, #e5e7eb ${binauralVolume * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-8">{Math.round(binauralVolume * 100)}%</span>
              </div>
              {/* Stop button */}
              {isPlaying && (
                <button
                  onClick={stopAudio}
                  className="px-6 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default BinauralBeatsWizard;