document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spinButton');
    const optionsForm = document.getElementById('optionsForm');
    const optionNameInput = document.getElementById('optionName');
    const optionRarityInput = document.getElementById('optionRarity');
    const optionsList = document.getElementById('optionsList');
    const formButton = document.getElementById('formButton');
    const editingIndexInput = document.getElementById('editingIndex');

    const modalOverlay = document.getElementById('modalOverlay');
    const modalResultText = document.getElementById('modalResultText');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const removeWinnerBtn = document.getElementById('removeWinnerBtn');
    
    const rarityWeights = {
        'Comum': 50,
        'Raro': 30,
        'Épico': 15,
        'Lendário': 5
    };

    let options = [];
    let currentRotation = 0;
    let spinning = false;
    let lastWinner = null; 
    
    const colors = [
        '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
        '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#BC4749'
    ];


    function loadOptions() {
        const savedOptions = localStorage.getItem('rouletteOptions');
        if (savedOptions && JSON.parse(savedOptions).length > 0) {
            options = JSON.parse(savedOptions);
        } else {
            options = [
                { name: 'Prêmio Lendário', rarity: 'Lendário', weight: 5 },
                { name: 'Prêmio Comum', rarity: 'Comum', weight: 50 },
                { name: 'Prêmio Épico', rarity: 'Épico', weight: 15 },
            ];
        }
        options.forEach(option => option.weight = parseInt(option.weight, 10));
    }

    function saveOptions() {
        localStorage.setItem('rouletteOptions', JSON.stringify(options));
    }

    function drawRoulette() {
        const numOptions = options.length;
        if (numOptions === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(250, 250, 240, 0, 2 * Math.PI);
            ctx.fillStyle = '#444';
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = '20px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Adicione opções!', 250, 250);
            return;
        }

        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let startAngle = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Poppins';

        for (let i = 0; i < numOptions; i++) {
            const option = options[i];
            const sliceAngle = (option.weight / totalWeight) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            // Desenha a fatia
            ctx.beginPath();
            ctx.moveTo(250, 250);
            ctx.arc(250, 250, 240, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            const textAngle = startAngle + sliceAngle / 2;
            
            ctx.translate(250, 250);
            
            ctx.rotate(textAngle);
            
            ctx.fillStyle = '#FFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textDistance = 160;

            let text = option.name;
            if (text.length > 15) {
                 text = text.substring(0, 12) + '...';
            }
            
            ctx.fillText(text, textDistance, 0);
            ctx.restore();
            
            startAngle = endAngle;
        }
    }

    function updateOptionsList() {
        optionsList.innerHTML = '';
        if (options.length === 0) {
            optionsList.innerHTML = '<li>Nenhuma opção cadastrada.</li>';
            return;
        }

        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="option-details">
                    <span class="option-name">${option.name}</span>
                    <span class="option-weight">Raridade: ${option.rarity} (Peso: ${option.weight})</span>
                </div>
                <div class="actions">
                    <button class="edit-btn" data-index="${index}">Editar</button>
                    <button class="delete-btn" data-index="${index}">Apagar</button>
                </div>
            `;
            li.querySelector('.edit-btn').addEventListener('click', () => handleEdit(index));
            li.querySelector('.delete-btn').addEventListener('click', () => handleDelete(index));
            optionsList.appendChild(li);
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const name = optionNameInput.value.trim();
        const rarity = optionRarityInput.value;
        const weight = rarityWeights[rarity];
        const editingIndex = parseInt(editingIndexInput.value, 10);

        if (!name || !rarity || isNaN(weight)) {
            alert('Erro ao processar a raridade. Tente novamente.');
            return;
        }

        const newOption = { name, rarity, weight };
        if (editingIndex > -1) {
            options[editingIndex] = newOption;
            formButton.textContent = 'Adicionar Opção';
            formButton.style.backgroundColor = 'var(--success-color)';
        } else {
            options.push(newOption);
        }

        optionsForm.reset();
        optionRarityInput.value = 'Comum';
        editingIndexInput.value = '-1';
        saveOptions();
        drawRoulette();
        updateOptionsList();
    }

    function handleEdit(index) {
        const option = options[index];
        optionNameInput.value = option.name;
        optionRarityInput.value = option.rarity;
        editingIndexInput.value = index;
        formButton.textContent = 'Atualizar Opção';
        formButton.style.backgroundColor = 'var(--primary-color)';
        optionNameInput.focus();
    }

    function handleDelete(index) {
        if (confirm(`Tem certeza que deseja apagar a opção "${options[index].name}"?`)) {
            options.splice(index, 1);
            saveOptions();
            drawRoulette();
            updateOptionsList();
        }
    }

    function getWeightedWinner() {
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let randomNum = Math.random() * totalWeight;
        for (let i = 0; i < options.length; i++) {
            if (randomNum < options[i].weight) {
                return { winner: options[i], index: i }; 
            }
            randomNum -= options[i].weight;
        }
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        lastWinner = null; // Limpa o vencedor
    }

    function handleRemoveWinner() {
        if (!lastWinner) return;

        // Remove a opção ganhadora do array 'options'
        options.splice(lastWinner.index, 1);
        
        saveOptions();
        drawRoulette();
        updateOptionsList();
        
        closeModal();
    }


    function spinWheel() {
        if (spinning || options.length === 0) return;
        
        spinning = true;
        spinButton.disabled = true;
        spinButton.textContent = 'GIRANDO...';

        const result = getWeightedWinner(); // Obtém o vencedor e o índice
        
        const { winner, index } = result;
        
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let startAngle = 0;

        for (let i = 0; i < index; i++) {
            startAngle += (options[i].weight / totalWeight) * 360;
        }
        const sliceAngle = (winner.weight / totalWeight) * 360;
        const randomPointInSlice = Math.random() * sliceAngle;
        const targetAngle = startAngle + randomPointInSlice;
        const finalRotation = (360 * 10) - targetAngle + (360 - currentRotation % 360);
        
        currentRotation += finalRotation;
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(() => {
            lastWinner = result;
            
            modalResultText.textContent = winner.name;
            
            modalOverlay.classList.remove('hidden');

            spinning = false;
            spinButton.disabled = false;
            spinButton.textContent = 'GIRAR!';
        }, 7000); 
    }

    function init() {
        loadOptions();
        drawRoulette();
        updateOptionsList();

        // Listeners Padrão
        optionsForm.addEventListener('submit', handleFormSubmit);
        spinButton.addEventListener('click', spinWheel);

        // Listeners do Modal
        closeModalBtn.addEventListener('click', closeModal);
        removeWinnerBtn.addEventListener('click', handleRemoveWinner);
        
        // Fechar o modal clicando no fundo (overlay)
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    init();
});