'use client'

import { useState, useRef } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

// ERK Niveaus
const ERK_LEVELS = [
  {
    code: 'A1',
    dutch: 'Doorbraakniveau',
    english: 'Breakthrough or Beginner',
    description: 'Je begrijpt en gebruikt eenvoudige woorden en zinnen, zoals jezelf voorstellen, iets bestellen of vragen naar de weg.'
  },
  {
    code: 'A2',
    dutch: 'Basisniveau',
    english: 'Waystage or Elementary',
    description: 'Je kunt korte gesprekken voeren over alledaagse onderwerpen zoals familie, werk of boodschappen doen.'
  },
  {
    code: 'B1',
    dutch: 'Drempelniveau',
    english: 'Threshold or Intermediate',
    description: 'Je redt je in veel dagelijkse situaties, zoals op het werk, bij instanties of tijdens reizen.'
  },
  {
    code: 'B2',
    dutch: 'Vervolg-/Zelfstandig niveau',
    english: 'Vantage or Upper-Intermediate',
    description: 'Je kunt goed communiceren in een werk- of studieomgeving en complexe teksten begrijpen.'
  },
  {
    code: 'C1',
    dutch: 'Effectieve operationele vaardigheid',
    english: 'Effective Operational Proficiency',
    description: 'Je spreekt vloeiend en spontaan over complexe onderwerpen, zowel mondeling als schriftelijk.'
  },
  {
    code: 'C2',
    dutch: 'Beheersingsniveau',
    english: 'Mastery or Proficient',
    description: 'Je begrijpt alles wat je hoort of leest en drukt je zeer vloeiend, genuanceerd en precies uit.'
  }
]

// Gemini Voices
const GEMINI_VOICES = [
  { name: 'Charon', style: 'Informative', description: 'Informatief Vlaams Nederlands' },
  { name: 'Kore', style: 'Firm', description: 'Stevig Vlaams Nederlands' },
  { name: 'Schedar', style: 'Even', description: 'Gelijkmatig Vlaams, ideaal voor onderwijs' },
  { name: 'Rasalgethi', style: 'Informative', description: 'Leerzaam Vlaams Nederlands' },
  { name: 'Iapetus', style: 'Clear', description: 'Kristalhelder Vlaams' },
  { name: 'Erinome', style: 'Clear', description: 'Helder Vlaams Nederlands' },
  { name: 'Gacrux', style: 'Mature', description: 'Volwassen Vlaams Nederlands' },
  { name: 'Sadaltager', style: 'Knowledgeable', description: 'Geleerd Vlaams Nederlands' },
  { name: 'Achird', style: 'Friendly', description: 'Vriendelijk Vlaams Nederlands' },
  { name: 'Vindemiatrix', style: 'Gentle', description: 'Zachtaardig Vlaams Nederlands' }
]

type AppStep = 'input' | 'audio' | 'quiz'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export default function ListeningExerciseApp() {
  const [currentStep, setCurrentStep] = useState<AppStep>('input')
  const [inputText, setInputText] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(ERK_LEVELS[2]) // B1 default
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[0])
  const [showSettings, setShowSettings] = useState(false)
  
  // Audio states
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Quiz states
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text()
      setInputText(text)
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
      // Handle document upload via API
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const response = await fetch('/api/upload-docx', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const data = await response.json()
          setInputText(data.content)
        } else {
          alert('Fout bij het uploaden van het document')
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Fout bij het uploaden van het document')
      }
    }
  }

  const generateAudio = async () => {
    if (!inputText.trim()) return
    
    setIsGeneratingAudio(true)
    
    try {
      // Voeg Vlaams Nederlands instructie toe aan de tekst
      const belgianDutchInstruction = "Spreek dit uit in Algemeen Nederlands zoals gesproken in België (Vlaanderen), zonder dialecten maar met Vlaamse uitspraak en intonatie: "
      const textWithBelgianDutch = belgianDutchInstruction + inputText
      
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textWithBelgianDutch,
          voiceName: selectedVoice.name,
          multiSpeaker: false,
          style: "Vlaams" // Gebruik Vlaamse stijl
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS API fout: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      setAudioBlob(blob)
      setAudioUrl(url)
      setCurrentStep('audio')
    } catch (error) {
      console.error('TTS Error:', error)
      alert('Fout bij het genereren van audio: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `luisteroefening_${selectedLevel.code}_${new Date().toISOString().slice(0, 10)}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true)
    
    try {
      const prompt = `Maak 5 begripsvragen over de volgende tekst voor ERK-niveau ${selectedLevel.code} (${selectedLevel.dutch}):

TEKST:
${inputText}

NIVEAU BESCHRIJVING:
${selectedLevel.description}

Maak vragen die passen bij dit niveau. Voor niveau ${selectedLevel.code}:
${selectedLevel.code === 'A1' || selectedLevel.code === 'A2' ? 
  '- Gebruik eenvoudige woorden en korte zinnen\n- Focus op hoofdinformatie en concrete details\n- Vermijd complexe grammatica' :
  selectedLevel.code === 'B1' || selectedLevel.code === 'B2' ?
  '- Gebruik gevarieerde woordenschat\n- Test begrip van hoofdgedachten en details\n- Inclusief wat inferentie' :
  '- Gebruik complexe woordenschat\n- Test diepgaand begrip en nuances\n- Inclusief kritisch denken en analyse'
}

Geef het antwoord in dit EXACTE JSON formaat:
{
  "questions": [
    {
      "question": "Vraag hier",
      "options": ["Optie A", "Optie B", "Optie C", "Optie D"],
      "correct": 0,
      "explanation": "Uitleg waarom dit het juiste antwoord is"
    }
  ]
}

Zorg dat elke vraag 4 antwoordopties heeft en dat de "correct" waarde het indexnummer (0-3) van het juiste antwoord is.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        }),
      })

      if (!response.ok) {
        throw new Error('Quiz generatie mislukt')
      }

      const data = await response.json()
      
      // Parse JSON from response
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const quizData = JSON.parse(jsonMatch[0])
          setQuizQuestions(quizData.questions)
          setCurrentQuestionIndex(0)
          setSelectedAnswers([])
          setShowResults(false)
          setQuizCompleted(false)
          setCurrentStep('quiz')
        } else {
          throw new Error('Geen geldige JSON gevonden in response')
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        alert('Fout bij het verwerken van de quiz. Probeer opnieuw.')
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      alert('Fout bij het genereren van de quiz: ' + (error instanceof Error ? error.message : 'Onbekende fout'))
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
      setShowResults(true)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const resetApp = () => {
    setCurrentStep('input')
    setInputText('')
    setAudioUrl('')
    setAudioBlob(null)
    setQuizQuestions([])
    setSelectedAnswers([])
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setQuizCompleted(false)
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const calculateScore = () => {
    let correct = 0
    selectedAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index]?.correct) {
        correct++
      }
    })
    return { correct, total: quizQuestions.length, percentage: Math.round((correct / quizQuestions.length) * 100) }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Instellingen</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* ERK Niveau Selectie */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">ERK Niveau</label>
              <select
                value={selectedLevel.code}
                onChange={(e) => {
                  const level = ERK_LEVELS.find(l => l.code === e.target.value)
                  if (level) setSelectedLevel(level)
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {ERK_LEVELS.map((level) => (
                  <option key={level.code} value={level.code}>
                    {level.code} - {level.dutch}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">{selectedLevel.description}</p>
            </div>

            {/* Stem Selectie */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">TTS Stem</label>
              <p className="text-xs text-blue-600 mb-2">
                🇧🇪 Alle stemmen zijn geoptimaliseerd voor Vlaams Nederlands (België)
              </p>
              <select
                value={selectedVoice.name}
                onChange={(e) => {
                  const voice = GEMINI_VOICES.find(v => v.name === e.target.value)
                  if (voice) setSelectedVoice(voice)
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {GEMINI_VOICES.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Standaard wordt Vlaamse uitspraak gebruikt zonder dialecten
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep === 'input' ? 'text-blue-600' : currentStep === 'audio' || currentStep === 'quiz' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'input' ? 'bg-blue-600 text-white' : currentStep === 'audio' || currentStep === 'quiz' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Tekst Invoer</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${currentStep === 'audio' || currentStep === 'quiz' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${currentStep === 'audio' ? 'text-blue-600' : currentStep === 'quiz' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'audio' ? 'bg-blue-600 text-white' : currentStep === 'quiz' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Audio Genereren</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${currentStep === 'quiz' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex items-center ${currentStep === 'quiz' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Quiz</span>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Instellingen</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {selectedLevel.code}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Step 1: Text Input */}
        {currentStep === 'input' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Stap 1: Tekst Invoeren</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Upload een tekstbestand (optioneel)
              </label>
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ondersteunde formaten: .txt, .docx, .pdf
              </p>
            </div>

            {/* Text Area */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Of plak/typ je tekst hier:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Plak of typ hier de tekst voor de luisteroefening..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {inputText.length} karakters
                </p>
                <p className="text-xs text-blue-600">
                  Niveau: {selectedLevel.code} - {selectedLevel.dutch}
                </p>
              </div>
            </div>

            {/* Generate Audio Button */}
            <button
              onClick={generateAudio}
              disabled={!inputText.trim() || isGeneratingAudio}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isGeneratingAudio ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Audio genereren...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 15.536a5 5 0 01-7.072 0M4.222 4.222a9 9 0 000 14.142M12 18.364l-1.414-1.414M12 5.636L10.586 7.05" />
                  </svg>
                  <span>Genereer TTS Audio</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Audio Player */}
        {currentStep === 'audio' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Stap 2: Audio Afspelen</h2>
            
            {/* Text Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Tekst:</h3>
              <div className="text-gray-600 text-sm max-h-32 overflow-y-auto">
                <MarkdownRenderer content={inputText} />
              </div>
            </div>

            {/* Audio Player */}
            <div className="mb-6 p-6 bg-blue-50 rounded-lg text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 15.536a5 5 0 01-7.072 0M4.222 4.222a9 9 0 000 14.142M12 18.364l-1.414-1.414M12 5.636L10.586 7.05" />
                </svg>
                <p className="text-blue-700 font-medium">
                  Stem: {selectedVoice.name} - {selectedVoice.description}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  🇧🇪 Vlaams Nederlands (België)
                </p>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="w-full mb-4"
                controls
              />

              <div className="flex justify-center space-x-4">
                <button
                  onClick={playAudio}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                      <span>Pauzeren</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span>Afspelen</span>
                    </>
                  )}
                </button>

                <button
                  onClick={downloadAudio}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Audio</span>
                </button>
              </div>
            </div>

            {/* Generate Quiz Button */}
            <button
              onClick={generateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isGeneratingQuiz ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Quiz genereren...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Genereer Quiz ({selectedLevel.code} niveau)</span>
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              onClick={() => setCurrentStep('input')}
              className="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Terug naar Tekst Invoer
            </button>
          </div>
        )}

        {/* Step 3: Quiz */}
        {currentStep === 'quiz' && (
          <div>
            {!showResults ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Quiz - {selectedLevel.code} Niveau
                  </h2>
                  <div className="text-sm text-gray-600">
                    Vraag {currentQuestionIndex + 1} van {quizQuestions.length}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {quizQuestions[currentQuestionIndex] && (
                  <div>
                    {/* Question */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {quizQuestions[currentQuestionIndex].question}
                      </h3>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3 mb-6">
                      {quizQuestions[currentQuestionIndex].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => selectAnswer(index)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedAnswers[currentQuestionIndex] === index && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button
                        onClick={previousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Vorige
                      </button>

                      <button
                        onClick={nextQuestion}
                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentQuestionIndex === quizQuestions.length - 1 ? 'Voltooien' : 'Volgende'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Quiz Results */
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Quiz Resultaten</h2>
                
                {(() => {
                  const score = calculateScore()
                  return (
                    <div className="mb-6 p-6 bg-green-50 rounded-lg text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {score.percentage}%
                      </div>
                      <p className="text-green-700 text-lg">
                        {score.correct} van {score.total} vragen correct
                      </p>
                      <p className="text-gray-600 mt-2">
                        ERK Niveau: {selectedLevel.code} - {selectedLevel.dutch}
                      </p>
                    </div>
                  )
                })()}

                {/* Detailed Results */}
                <div className="space-y-4 mb-6">
                  {quizQuestions.map((question, index) => {
                    const userAnswer = selectedAnswers[index]
                    const isCorrect = userAnswer === question.correct
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border-2 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Vraag {index + 1}: {question.question}
                          </h4>
                          <div className={`px-2 py-1 rounded text-sm font-medium ${
                            isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {isCorrect ? 'Correct' : 'Fout'}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Jouw antwoord:</strong> {question.options[userAnswer]}
                        </div>
                        
                        {!isCorrect && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Correct antwoord:</strong> {question.options[question.correct]}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-700">
                          <strong>Uitleg:</strong> {question.explanation}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('audio')}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Terug naar Audio
                  </button>
                  
                  <button
                    onClick={resetApp}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Nieuwe Oefening
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}