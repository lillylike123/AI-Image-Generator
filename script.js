const HF_MODEL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

const promptInput = document.getElementById('prompt');
const styleSelect = document.getElementById('style');
const resolutionSelect = document.getElementById('resolution');
const qualitySelect = document.getElementById('quality');
const countSelect = document.getElementById('count');
const generateBtn = document.getElementById('generateBtn');
const resultsDiv = document.getElementById('results');
const loadingSpinner = document.querySelector('.loading-spinner');
const btnText = document.querySelector('.btn-text');

let isGenerating = false;

function getToken() {
    return localStorage.getItem('hf_token') || '';
}

function promptForToken() {
    const existing = document.getElementById('token-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'token-modal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; align-items: center;
        justify-content: center; z-index: 1000;`;
    modal.innerHTML = `
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 2rem; max-width: 480px; width: 90%;">
            <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem;">Enter your Hugging Face token</h2>
            <p style="font-size: 0.85rem; color: #888; margin-bottom: 1.25rem; line-height: 1.5;">
                This app uses the free <strong style="color:#ccc">FLUX.1</strong> model via Hugging Face.<br>
                Get a free token at <a href="https://huggingface.co/settings/tokens" target="_blank" style="color: #4a9eff;">huggingface.co/settings/tokens</a>
                (Read access is enough).
            </p>
            <input id="token-input" type="password" placeholder="hf_..."
                style="width: 100%; padding: 0.75rem; background: #111; border: 1px solid #333;
                border-radius: 6px; color: #fff; font-size: 0.9rem; margin-bottom: 0.75rem;" />
            <div style="display: flex; gap: 0.5rem;">
                <button id="token-save" style="flex: 1; padding: 0.75rem; background: #4a9eff; color: white;
                    border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                    Save & Generate
                </button>
                <button id="token-cancel" style="padding: 0.75rem 1rem; background: #333; color: white;
                    border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                    Cancel
                </button>
            </div>
            <p style="font-size: 0.75rem; color: #555; margin-top: 0.75rem;">
                Your token is saved only in your browser's local storage and never sent anywhere except Hugging Face.
            </p>
        </div>`;

    document.body.appendChild(modal);

    const input = document.getElementById('token-input');
    input.focus();

    document.getElementById('token-save').addEventListener('click', () => {
        const val = input.value.trim();
        if (!val.startsWith('hf_')) {
            input.style.borderColor = '#ef4444';
            input.placeholder = 'Must start with hf_...';
            return;
        }
        localStorage.setItem('hf_token', val);
        modal.remove();
        generateImages();
    });

    document.getElementById('token-cancel').addEventListener('click', () => modal.remove());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('token-save').click(); });
}

generateBtn.addEventListener('click', () => {
    if (!getToken()) { promptForToken(); return; }
    generateImages();
});

promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) generateBtn.click();
});

// Allow clearing the token via a small link in results area
document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.createElement('div');
    clearBtn.style.cssText = 'text-align:right; font-size: 0.75rem; color: #555; margin-bottom: 0.5rem; cursor: pointer;';
    clearBtn.innerHTML = '<span id="clear-token" style="text-decoration:underline;">Change HF token</span>';
    clearBtn.addEventListener('click', () => {
        localStorage.removeItem('hf_token');
        showStatusMessage('info', 'Token cleared. You\'ll be asked for it next time you generate.');
    });
    resultsDiv.parentElement.insertBefore(clearBtn, resultsDiv);
});

function generateImages() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatusMessage('error', 'Please enter a description for your image.');
        return;
    }
    if (isGenerating) return;

    isGenerating = true;
    generateBtn.disabled = true;
    loadingSpinner.style.display = 'inline-block';
    btnText.textContent = 'Generating...';
    resultsDiv.innerHTML = '';
    showStatusMessage('info', 'Generating your images... This may take 20–40 seconds.');

    const imageCount = parseInt(countSelect.value);
    const resolution = resolutionSelect.value;
    const style = styleSelect.value;
    const quality = qualitySelect.value;

    generateImageCards(prompt, imageCount, resolution, style, quality);
}

async function generateImageCards(prompt, count, resolution, style, quality) {
    const imageGrid = document.createElement('div');
    imageGrid.className = 'image-grid';

    const [width, height] = resolution.split('x').map(Number);
    const enhancedPrompt = `${prompt}, ${style} style, ${quality} quality, highly detailed`;

    const jobs = Array.from({ length: count }, (_, i) =>
        generateSingleImage(enhancedPrompt, width, height, i)
    );

    const cards = await Promise.all(jobs);
    cards.forEach(card => imageGrid.appendChild(card));
    resultsDiv.appendChild(imageGrid);

    isGenerating = false;
    generateBtn.disabled = false;
    loadingSpinner.style.display = 'none';
    btnText.textContent = 'Generate Images';
    showStatusMessage('success', `Successfully generated ${count} image${count > 1 ? 's' : ''}!`);
}

async function generateSingleImage(prompt, width, height, idx, isRetry = false) {
    const card = document.createElement('div');
    card.className = 'image-card';

    try {
        const response = await fetch(HF_MODEL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { width, height }
            })
        });

        if (response.status === 401) {
            localStorage.removeItem('hf_token');
            throw new Error('Invalid token. Click "Change HF token" and try again.');
        }

        if (response.status === 503 && !isRetry) {
            showStatusMessage('info', 'Model is loading, retrying in 20 seconds...');
            await new Promise(r => setTimeout(r, 20000));
            return generateSingleImage(prompt, width, height, idx, true);
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Error ${response.status}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        card.innerHTML = `
            <div class="image-container" style="position: relative; overflow: hidden; background: #222; min-height: 300px;">
                <img src="${imageUrl}" alt="Generated image"
                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px 8px 0 0;"
                     class="generated-img">
                <div class="image-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                     background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.3s ease;
                     display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">
                    Click to view full size
                </div>
            </div>
            <div class="image-info">
                <div class="image-prompt" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${prompt.substring(0, 80)}"</div>
                <div class="image-details">
                    <span>${width}x${height}</span>
                    <span>FLUX.1</span>
                </div>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <button class="download-btn" style="flex: 1; padding: 0.5rem; background: #4a9eff; color: white;
                        border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Download</button>
                    <button class="view-btn" style="flex: 1; padding: 0.5rem; background: #333; color: white;
                        border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">View Full</button>
                </div>
            </div>`;

        card.querySelector('.download-btn').addEventListener('click', () => downloadBlob(blob, `ai-image-${idx + 1}`));
        card.querySelector('.view-btn').addEventListener('click', () => openImageModal(imageUrl, prompt));
        card.addEventListener('mouseenter', () => card.querySelector('.image-overlay').style.opacity = '1');
        card.addEventListener('mouseleave', () => card.querySelector('.image-overlay').style.opacity = '0');

    } catch (err) {
        card.innerHTML = `<div class="image-placeholder" style="height:300px; display:flex; align-items:center;
            justify-content:center; flex-direction:column; gap:8px; padding: 1rem; text-align:center;">
            <span>⚠️ Failed to generate</span>
            <small style="color:#888">${err.message}</small>
        </div>`;
    }

    return card;
}

function showStatusMessage(type, message) {
    const existing = document.querySelector('.status-message');
    if (existing) existing.remove();
    if (!message) return;
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    resultsDiv.insertBefore(statusDiv, resultsDiv.firstChild);
    if (type === 'success' || type === 'info') {
        setTimeout(() => statusDiv.parentNode && statusDiv.remove(), 6000);
    }
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function openImageModal(imageUrl, prompt) {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); display: flex; align-items: center;
        justify-content: center; z-index: 1000; cursor: pointer;`;
    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; position: relative;" onclick="event.stopPropagation()">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px;">
            <button style="position: absolute; top: -40px; right: 0; background: #ff4444; color: white;
                border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>`;
    modal.querySelector('button').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}

const samplePrompts = [
    "A majestic mountain landscape at golden hour with a crystal clear lake reflecting the peaks",
    "A futuristic robot sitting in a cozy library reading a book",
    "An ancient Japanese temple surrounded by cherry blossoms in full bloom",
    "A steampunk airship floating above a Victorian city at sunset",
    "A magical forest with glowing mushrooms and ethereal light filtering through the trees"
];

document.addEventListener('click', (e) => {
    if (e.target.closest('.placeholder') && !promptInput.value.trim()) {
        promptInput.value = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        promptInput.focus();
    }
});