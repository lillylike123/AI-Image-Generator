const imageCard = `<div class="image-container" style="position: relative; overflow: hidden;">
        <img src="" alt="" style="
                width: 100%;
                height: 300px; 
                object-fit: cover; 
                border-radius: 8px 8px 0 0; 
                transition: transform 0.3s ease;
                " onload="this.style.opacity='1'"
            onerror="this.parentElement.innerHTML = '<div class=\\'image-placeholder\\'>Failed to generate image</div>'"
            loading="lazy" />

        <div class="image-overlay" style="
                position: absolute; 
                top: 0; 
                left: 0; 
                right: 0; 
                bottom: 0; 
                background: rgba(0,0,0,0.7); 
                opacity: 0; 
                transition: 0.3s ease; 
                display: flex; 
                justify-content: center;
                align-items: center; 
                color: white; 
                font-size: 0.9rem;">
            Click to view full size
        </div>
    </div>
    <div class="image-info">
        <div class="image-prompt">${prompt}</div>
        <div class="image-details">
            <span>${resolution}</span>
            <span>${style}</span>
            <span>${quality}</span>
        </div>

        <div style="
            margin-top: 0.5rem;
            display: flex;
            gap: 0.5rem;
            ">

            

            <button onclick="downloadImage('${imageUrl}', '${prompt.substring(0, 30)}')" 
            style="
            flex:1;
            padding:0.5rem;
            background: #4a9eff;
            color:white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            ">
                Download
            </button>

            

            <button onclick="openImageModal('${imageUrl}', '${prompt}')" 
            style="
            flex:1;
            padding:0.5rem;
            background: #333;
            color:white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            ">
                View Full
            </button>

        </div>
    </div>`