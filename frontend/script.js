document.addEventListener('DOMContentLoaded', (event) => {
    
    const themeToggle = document.getElementById('checkbox');
    const tripForm = document.getElementById('trip-form');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.querySelector('.btn-text');
    const btnSpinner = document.querySelector('.btn-spinner');
    const resultContainer = document.getElementById('result-container');
    const itineraryEl = document.getElementById('itinerary');
    const welcomeMessage = document.getElementById('welcome-message');

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-mode') {
            themeToggle.checked = true;
        }
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light-mode');
        }
    });

    tripForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const destination = document.getElementById('destination').value;
        const days = parseInt(document.getElementById('days').value, 10);
        const interests = document.getElementById('interests').value;
        const travelType = document.getElementById('travel-type').value;
        const budget = document.getElementById('budget').value;

        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');
        
        resultContainer.classList.remove('visible');
        welcomeMessage.classList.remove('visible');
        
        itineraryEl.innerHTML = '';
        
        let fullResponse = '';
        let hasStartedStreaming = false;

        try {
            const response = await fetch('http://localhost:8000/planejar-viagem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: destination,
                    days: days,
                    interests: interests,
                    travel_type: travelType,
                    budget: budget
                })
            });

            if (!response.ok) {
                throw new Error('Falha ao gerar o roteiro. Tente novamente.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                
                if (!hasStartedStreaming) {
                    resultContainer.classList.add('visible');
                    hasStartedStreaming = true;
                }

                if (done) {
                    break;
                }
                const chunk = decoder.decode(value);
                fullResponse += chunk;
                itineraryEl.innerHTML = marked.parse(fullResponse);
            }

        } catch (error) {
            itineraryEl.innerHTML = `Erro na requisição: ${error.message}`;
            resultContainer.classList.add('visible');
        } finally {
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
            
            if (!hasStartedStreaming) {
                welcomeMessage.classList.add('visible');
            }
        }
    });
});