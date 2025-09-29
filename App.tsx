import React, { useState, useCallback } from 'react';
import { ApiStatus } from './types';
import type { ImageFile, RestoreOptions } from './types';
import { DEFAULT_PROMPT_HEADER, OPTIONAL_PROMPTS } from './constants';
import { restoreImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';

const fileToImageFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = (event.target?.result as string)?.split(',')[1];
            if (base64) {
                resolve({ base64, mimeType: file.type });
            } else {
                reject(new Error("Failed to read file as base64."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
    const [maskImage, setMaskImage] = useState<ImageFile | null>(null);
    const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
    const [maskImagePreview, setMaskImagePreview] = useState<string | null>(null);
    
    const [restoredImage, setRestoredImage] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);

    const [status, setStatus] = useState<ApiStatus>(ApiStatus.IDLE);
    const [error, setError] = useState<string | null>(null);

    const [prompt, setPrompt] = useState<string>('');
    const [options, setOptions] = useState<RestoreOptions>({
        basicRestore: true,
        colorize: false,
        upscale: false,
        adjustLighting: 'none',
        backgroundAction: 'none',
        replaceBackgroundDescription: '',
        creativeMode: 'none',
        outputColor: 'auto_colorize',
    });

    const handleOriginalImageUpload = async (file: File) => {
        setOriginalImagePreview(URL.createObjectURL(file));
        const imageFile = await fileToImageFile(file);
        setOriginalImage(imageFile);
    };

    const handleMaskImageUpload = async (file: File) => {
        setMaskImagePreview(URL.createObjectURL(file));
        const imageFile = await fileToImageFile(file);
        setMaskImage(imageFile);
    };
    
    const handleClearOriginal = () => {
        setOriginalImage(null);
        setOriginalImagePreview(null);
    };

    const handleClearMask = () => {
        setMaskImage(null);
        setMaskImagePreview(null);
    };

    const buildFullPrompt = useCallback(() => {
        let fullPrompt = DEFAULT_PROMPT_HEADER;

        if (options.basicRestore) fullPrompt += OPTIONAL_PROMPTS.basicRestore;
        
        if (options.colorize) {
            fullPrompt += OPTIONAL_PROMPTS.colorize;
        } else {
            if (options.outputColor === 'keep_bw') {
                fullPrompt += OPTIONAL_PROMPTS.outputColor.keep_bw;
            } else if (options.outputColor === 'studio_colorize') {
                fullPrompt += OPTIONAL_PROMPTS.outputColor.studio_colorize;
            }
        }

        if (options.upscale) fullPrompt += OPTIONAL_PROMPTS.upscale;
        if (options.adjustLighting !== 'none') {
            fullPrompt += OPTIONAL_PROMPTS.adjustLighting[options.adjustLighting];
        }
        if (options.backgroundAction !== 'none') {
            if (options.backgroundAction === 'replace') {
                if (options.replaceBackgroundDescription.trim()) {
                    fullPrompt += OPTIONAL_PROMPTS.background.replace(options.replaceBackgroundDescription);
                }
            } else {
                 fullPrompt += OPTIONAL_PROMPTS.background[options.backgroundAction as 'remove' | 'blur'];
            }
        }
        if (options.creativeMode !== 'none') {
            fullPrompt += OPTIONAL_PROMPTS.creativeMode[options.creativeMode];
        }

        if (prompt.trim()) {
            fullPrompt += OPTIONAL_PROMPTS.userInstructions(prompt);
        }
        
        fullPrompt += OPTIONAL_PROMPTS.outputNote;

        return fullPrompt;
    }, [prompt, options]);

    const handleSubmit = async () => {
        if (!originalImage) {
            setError("Vui lòng tải lên ảnh gốc để phục chế.");
            return;
        }

        setStatus(ApiStatus.LOADING);
        setError(null);
        setRestoredImage(null);
        setResponseText(null);

        const fullPrompt = buildFullPrompt();
        
        try {
            const result = await restoreImage(originalImage, maskImage, fullPrompt);
            if (result.imageUrl) {
                setRestoredImage(result.imageUrl);
                setResponseText(result.text);
                setStatus(ApiStatus.SUCCESS);
            } else {
                throw new Error("Quá trình phục chế không trả về hình ảnh.");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
            setError(errorMessage);
            setStatus(ApiStatus.ERROR);
        }
    };

    const commonSelectClass = "w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Phục Chế Ảnh AI
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Hồi sinh những bức ảnh cũ của bạn bằng sức mạnh của AI.</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Control Panel */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ImageUploader id="original" label="1. Ảnh Gốc" onImageUpload={handleOriginalImageUpload} previewUrl={originalImagePreview} onClear={handleClearOriginal} />
                            <ImageUploader id="mask" label="2. Mặt Nạ (Tùy chọn)" onImageUpload={handleMaskImageUpload} previewUrl={maskImagePreview} onClear={handleClearMask}/>
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">3. Hướng Dẫn Thêm</label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="ví dụ: 'Xóa vết nứt bên trái', 'Làm màu sắc rực rỡ hơn'"
                                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            ></textarea>
                        </div>
                        
                        {/* Optional Enhancements */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">4. Các Tùy Chọn Nâng Cao</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <input type="checkbox" id="basicRestore" checked={options.basicRestore} onChange={e => setOptions({...options, basicRestore: e.target.checked})} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"/>
                                    <label htmlFor="basicRestore" className="ml-2 text-sm text-gray-300">✅ Phục chế cơ bản</label>
                                </div>
                                <div className="flex items-center">
                                    <input type="checkbox" id="colorize" checked={options.colorize} onChange={e => setOptions({...options, colorize: e.target.checked})} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"/>
                                    <label htmlFor="colorize" className="ml-2 text-sm text-gray-300">🎨 Tô màu ảnh đen trắng</label>
                                </div>
                                <div className="flex items-center">
                                    <input type="checkbox" id="upscale" checked={options.upscale} onChange={e => setOptions({...options, upscale: e.target.checked})} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"/>
                                    <label htmlFor="upscale" className="ml-2 text-sm text-gray-300">🔍 Nâng độ phân giải</label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="outputColor" className={`block text-sm font-medium text-gray-300 mb-1 transition-opacity duration-300 ${options.colorize ? 'opacity-50' : 'opacity-100'}`}>🎭 Tuỳ chọn xuất ảnh</label>
                                    <select
                                        id="outputColor"
                                        value={options.outputColor}
                                        onChange={e => setOptions({...options, outputColor: e.target.value as RestoreOptions['outputColor']})}
                                        className={`${commonSelectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={options.colorize}
                                    >
                                        <option value="auto_colorize">Tô màu tự động</option>
                                        <option value="keep_bw">Giữ đen trắng</option>
                                        <option value="studio_colorize">Tô màu studio 2025</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="adjustLighting" className="block text-sm font-medium text-gray-300 mb-1">💡 Điều chỉnh ánh sáng</label>
                                    <select id="adjustLighting" value={options.adjustLighting} onChange={e => setOptions({...options, adjustLighting: e.target.value as RestoreOptions['adjustLighting']})} className={commonSelectClass}>
                                        <option value="none">Không</option>
                                        <option value="increase">Tăng sáng</option>
                                        <option value="decrease">Giảm sáng</option>
                                        <option value="natural">Ánh sáng tự nhiên</option>
                                        <option value="studio">Ánh sáng studio</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="backgroundAction" className="block text-sm font-medium text-gray-300 mb-1">🖼️ Thay nền ảnh</label>
                                    <select id="backgroundAction" value={options.backgroundAction} onChange={e => setOptions({...options, backgroundAction: e.target.value as RestoreOptions['backgroundAction']})} className={commonSelectClass}>
                                        <option value="none">Không</option>
                                        <option value="remove">Tách nền</option>
                                        <option value="blur">Làm mờ nền</option>
                                        <option value="replace">Thay nền mới</option>
                                    </select>
                                    {options.backgroundAction === 'replace' && (
                                        <input type="text" value={options.replaceBackgroundDescription} onChange={e => setOptions({...options, replaceBackgroundDescription: e.target.value})} placeholder="Mô tả nền mới (ví dụ: bãi biển hoàng hôn)" className="mt-2 w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="creativeMode" className="block text-sm font-medium text-gray-300 mb-1">✨ Chế độ sáng tạo</label>
                                    <select id="creativeMode" value={options.creativeMode} onChange={e => setOptions({...options, creativeMode: e.target.value as RestoreOptions['creativeMode']})} className={commonSelectClass}>
                                        <option value="none">Không</option>
                                        <option value="vintage">Cổ điển</option>
                                        <option value="cinematic">Điện ảnh</option>
                                        <option value="cartoon">Hoạt hình</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!originalImage || status === ApiStatus.LOADING}
                            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            {status === ApiStatus.LOADING ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </div>
                            ) : "Phục Chế Ảnh"}
                        </button>
                    </div>

                    {/* Result Display */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                            <div className="flex flex-col items-center">
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">Ảnh Gốc</h3>
                                <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                                    {originalImagePreview ? (
                                        <img src={originalImagePreview} alt="Ảnh Gốc" className="object-contain w-full h-full rounded-lg" />
                                    ) : (
                                        <p className="text-gray-500">Tải ảnh lên</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">Ảnh Đã Phục Chế</h3>
                                <div className="relative w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 overflow-hidden">
                                    {status === ApiStatus.LOADING && (
                                        <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                                    )}
                                    {status === ApiStatus.ERROR && error && (
                                        <div className="p-4 text-center text-red-400">
                                            <p className="font-semibold">Lỗi</p>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}
                                    {status === ApiStatus.SUCCESS && restoredImage && (
                                        <>
                                            <img src={restoredImage} alt="Ảnh Đã Phục Chế" className="object-contain w-full h-full rounded-lg" />
                                            <a
                                                href={restoredImage}
                                                download="restored-image.png"
                                                className="absolute bottom-4 right-4 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                Tải Về
                                            </a>
                                        </>
                                    )}
                                    {status === ApiStatus.IDLE && !restoredImage && (
                                         <p className="text-gray-500">Kết quả sẽ hiện ở đây</p>
                                    )}
                                </div>
                                {responseText && status === ApiStatus.SUCCESS && (
                                    <p className="text-xs text-gray-400 mt-2 text-center p-2 bg-gray-700 rounded-md">{responseText}</p>
                                )}
                            </div>
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
