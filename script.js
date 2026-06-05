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

generateBtn.addEventListener('click', generateImages);

promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        generateImages();
    }
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

    
    showStatusMessage('info', 'Generating your images... This may take a few moments.');

    const imageCount = parseInt(countSelect.value);
    const resolution = resolutionSelect.value;
    const style = styleSelect.value;
    const quality = qualitySelect.value;


    generateImageCards(prompt, imageCount, resolution, style, quality);
}

async function generateImageCards(prompt, count, resolution, style, quality) {
    const imageGrid = document.createElement('div');
    imageGrid.className = 'image-grid';


    let imagesLoadedCount = 0;
    const totalImages = count;

    function checkCompletion() {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            isGenerating = false;
            generateBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            btnText.textContent = 'Generate Images';
            showStatusMessage('success', `Successfully generated ${count} image${count > 1 ? 's' : ''}!`);
        }
    }

    for (let i = 0; i < count; i++) {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';

        
        const enhancedPrompt = `${prompt}, ${style} style, ${quality} quality, highly detailed`;
        
        
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${resolution.split('x')[0]}&height=${resolution.split('x')[1]}&seed=${Date.now() + i}&nologo=true`;

        imageCard.innerHTML = `
            <div class="image-container" style="position: relative; overflow: hidden; background: #222; min-height: 300px;">
                <img src="${imageUrl}" 
                     alt="Generated image: ${prompt}" 
                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px 8px 0 0; opacity: 0; transition: opacity 0.5s ease;"
                     class="generated-img"
                     loading="lazy">
                <div class="image-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem;">
                    Click to view full size
                </div>
            </div>
            <div class="image-info">
                <div class="image-prompt" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${prompt}"</div>
                <div class="image-details">
                    <span>${resolution}</span>
                    <span>${style} style</span>
                    <span>${quality} quality</span>
                </div>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <button class="download-btn" style="flex: 1; padding: 0.5rem; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Download
                    </button>
                    <button class="view-btn" style="flex: 1; padding: 0.5rem; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        View Full
                    </button>
                </div>
            </div>
        `;

        const imgElement = imageCard.querySelector('.generated-img');
        
        
        imgElement.onload = function() {
            this.style.opacity = '1';
            checkCompletion();
        };

        
        imgElement.onerror = function() {
            this.parentElement.innerHTML = '<div class="image-placeholder">Failed to generate image</div>';
            checkCompletion();
        };

        
        imageCard.querySelector('.download-btn').addEventListener('click', () => {
            downloadImage(imageUrl, prompt.substring(0, 30));
        });

        imageCard.querySelector('.view-btn').addEventListener('click', () => {
            openImageModal(imageUrl, prompt);
        });

        
        imageCard.addEventListener('mouseenter', () => {
            const overlay = imageCard.querySelector('.image-overlay');
            if (overlay) overlay.style.opacity = '1';
        });

        imageCard.addEventListener('mouseleave', () => {
            const overlay = imageCard.querySelector('.image-overlay');
            if (overlay) overlay.style.opacity = '0';
        });

        imageGrid.appendChild(imageCard);
    }

    resultsDiv.appendChild(imageGrid);
}

function showStatusMessage(type, message) {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;

    resultsDiv.insertBefore(statusDiv, resultsDiv.firstChild);

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
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
        const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        promptInput.value = randomPrompt;
        promptInput.focus();
    }
});


async function downloadImage(imageUrl, filename) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `ai-${filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up memory
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download image automatically. Try opening Full View and right-clicking to save.");
    }
}


function openImageModal(imageUrl, prompt) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); display: flex; align-items: center;
        justify-content: center; z-index: 1000; cursor: pointer;
    `;

    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; position: relative;" onclick="event.stopPropagation()">
            <img src="${imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
            <div style="position: absolute; top: -40px; left: 0; right: 0; text-align: center; color: white; font-size: 0.9rem;">
                "${prompt}"
            </div>
            <button class="close-modal-btn" 
                    style="position: absolute; top: -40px; right: 0; background: #ff4444; color: white; border: none; 
                           border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
    `;

    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', () => modal.remove());

    document.body.appendChild(modal);
}