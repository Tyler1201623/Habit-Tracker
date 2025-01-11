class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('habits')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        this.currentView = localStorage.getItem('view') || 'grid';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.renderHabits();
        this.updateStats();
        this.setupModals();
        this.setupViewControls();
        this.setupFilters();
        
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
        this.checkDeviceType();
    }

    setupEventListeners() {
        document.getElementById('habitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('showStats').addEventListener('click', () => {
            this.showStatsModal();
        });

        document.getElementById('showSettings').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('searchHabits').addEventListener('input', (e) => {
            this.filterHabits();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterHabits();
        });

        document.getElementById('sortHabits').addEventListener('change', () => {
            this.sortHabits();
        });
    }

    setupModals() {
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    setupViewControls() {
        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', () => {
                this.currentView = button.dataset.view;
                localStorage.setItem('view', this.currentView);
                this.updateViewControls();
                this.handleViewChange();
                this.renderHabits();
            });
        });
    }

    handleViewChange() {
        const container = document.getElementById('habitsContainer');
        container.className = `habits-${this.currentView}`;
        
        if (window.innerWidth >= 600 && window.innerWidth <= 800) {
            container.style.gridTemplateColumns = '1fr';
        }
    }

    handleResize() {
        this.handleViewChange();
        this.renderHabits();
    }

    setupFilters() {
        const searchInput = document.getElementById('searchHabits');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortHabits');

        [searchInput, categoryFilter, sortSelect].forEach(element => {
            element.addEventListener('change', () => this.filterAndSortHabits());
            element.addEventListener('input', () => this.filterAndSortHabits());
        });
    }

    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        document.getElementById('themeToggle').textContent = this.theme === 'light' ? '🌙' : '☀️';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.loadTheme();
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const category = document.getElementById('habitCategory');
        const habitName = input.value.trim();
        
        if (habitName) {
            const habit = {
                id: Date.now(),
                name: habitName,
                category: category.value,
                completedDays: {},
                currentStreak: 0,
                longestStreak: 0,
                createdAt: new Date().toISOString()
            };

            this.habits.push(habit);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            input.value = '';
            
            this.showNotification('Habit added successfully!', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }

    toggleDay(habitId, day) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const dateKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${day}`;
            habit.completedDays[dateKey] = !habit.completedDays[dateKey];
            this.updateStreaks(habit);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
        }
    }

    updateStreaks(habit) {
        const today = new Date();
        const currentDate = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let currentStreak = 0;
        let checking = true;
        let checkDate = new Date(today);

        while (checking && checkDate.getMonth() === currentMonth) {
            const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            
            if (habit.completedDays[dateKey]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                checking = false;
            }
        }

        let longestStreak = habit.longestStreak;
        let tempStreak = 0;
        
        for (let i = 1; i <= 31; i++) {
            const dateKey = `${currentYear}-${currentMonth}-${i}`;
            
            if (habit.completedDays[dateKey]) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        habit.currentStreak = currentStreak;
        habit.longestStreak = longestStreak;
    }

    calculateProgress(habit) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        let completedCount = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${currentMonth}-${day}`;
            if (habit.completedDays[dateKey]) {
                completedCount++;
            }
        }
        
        return (completedCount / daysInMonth) * 100;
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            this.showNotification('Habit deleted', 'warning');
        }
    }

    editHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            const newName = prompt('Enter new habit name:', habit.name);
            if (newName && newName.trim()) {
                habit.name = newName.trim();
                this.saveHabits();
                this.renderHabits();
                this.showNotification('Habit updated', 'success');
            }
        }
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    filterAndSortHabits() {
        let filteredHabits = [...this.habits];
        const searchTerm = document.getElementById('searchHabits').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortHabits').value;

        if (searchTerm) {
            filteredHabits = filteredHabits.filter(habit => 
                habit.name.toLowerCase().includes(searchTerm)
            );
        }

        if (category !== 'all') {
            filteredHabits = filteredHabits.filter(habit => 
                habit.category === category
            );
        }

        switch (sortBy) {
            case 'name':
                filteredHabits.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'streak':
                filteredHabits.sort((a, b) => b.currentStreak - a.currentStreak);
                break;
            case 'progress':
                filteredHabits.sort((a, b) => this.calculateProgress(b) - this.calculateProgress(a));
                break;
        }

        this.renderHabits(filteredHabits);
    }

    updateStats() {
        const totalHabits = this.habits.length;
        const completionRates = this.habits.map(habit => this.calculateProgress(habit));
        const averageCompletion = completionRates.reduce((a, b) => a + b, 0) / totalHabits || 0;
        const bestStreak = Math.max(...this.habits.map(habit => habit.longestStreak), 0);

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('completionRate').textContent = `${averageCompletion.toFixed(1)}%`;
        document.getElementById('bestStreak').textContent = `${bestStreak} days`;
    }

    showStatsModal() {
        document.getElementById('statsModal').style.display = 'flex';
    }

    updateViewControls() {
        document.querySelectorAll('.view-button').forEach(button => {
            button.classList.toggle('active', button.dataset.view === this.currentView);
        });
        document.getElementById('habitsContainer').className = `habits-${this.currentView}`;
    }

    renderHabits(habits = this.habits) {
        const container = document.getElementById('habitsContainer');
        container.innerHTML = '';

        habits.forEach(habit => {
            const progress = this.calculateProgress(habit);
            const habitCard = this.createHabitCard(habit, progress);
            container.appendChild(habitCard);
        });
    }

    createHabitCard(habit, progress) {
        const card = document.createElement('div');
        card.className = `habit-card ${habit.category}`;
        
        const header = document.createElement('div');
        header.className = 'habit-header';
        header.innerHTML = `
            <div class="habit-title">
                <h3>${habit.name}</h3>
                <span class="category-badge">${habit.category}</span>
            </div>
            <div class="habit-actions">
                <button class="edit-button" onclick="habitTracker.editHabit(${habit.id})">✏️</button>
                <button class="delete-button" onclick="habitTracker.deleteHabit(${habit.id})">❌</button>
            </div>
        `;

        const calendar = this.createCalendar(habit);
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${progress}%"></div>
            <span class="progress-text">${progress.toFixed(1)}%</span>
        `;

        const streakInfo = document.createElement('div');
        streakInfo.className = 'streak-info';
        streakInfo.innerHTML = `
            <span>Current Streak: ${habit.currentStreak} days</span>
            <span>Longest Streak: ${habit.longestStreak} days</span>
        `;

        card.appendChild(header);
        card.appendChild(calendar);
        card.appendChild(progressBar);
        card.appendChild(streakInfo);

        return card;
    }

    createCalendar(habit) {
        const calendar = document.createElement('div');
        calendar.className = 'calendar-grid';

        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 767;
        const isTablet = screenWidth > 767 && screenWidth <= 1024;

        const daysInMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${day}`;
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day${habit.completedDays[dateKey] ? ' completed' : ''}`;
            dayElement.textContent = day;
            
            if (isMobile || isTablet) {
                dayElement.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.toggleDay(habit.id, day);
                });
            }
            
            dayElement.onclick = () => this.toggleDay(habit.id, day);
            calendar.appendChild(dayElement);
        }

        return calendar;
    }

    handleResize() {
        this.renderHabits();
    }

    checkDeviceType() {
        const ua = navigator.userAgent;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            document.body.classList.add('mobile-device');
        }
    }
}

const habitTracker = new HabitTracker();
