// ===== 1. 스크롤 등장 애니메이션 (Intersection Observer) =====
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('section, article, aside, .highlight, blockquote').forEach(el => {
    el.classList.add('fade-up');
    fadeObserver.observe(el);
});

// ===== 2. 네비게이션 활성 표시 (스크롤 스파이) =====
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.scrollY + 120;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(link => {
                link.classList.remove('nav-active');
                if (link.getAttribute('href') === '#' + id) {
                    link.classList.add('nav-active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);
updateActiveNav();

// ===== 3. 맨 위로 가기 버튼 =====
const topBtn = document.createElement('button');
topBtn.id = 'topBtn';
topBtn.textContent = '\u2191';
topBtn.title = '\ub9e8 \uc704\ub85c';
document.body.appendChild(topBtn);

window.addEventListener('scroll', () => {
    topBtn.classList.toggle('show', window.scrollY > 400);
});

topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 4. 다크모드 토글 =====
const darkBtn = document.createElement('button');
darkBtn.id = 'darkToggle';
darkBtn.textContent = '\ud83c\udf19';
darkBtn.title = '\ub2e4\ud06c\ubaa8\ub4dc \uc804\ud658';
document.body.appendChild(darkBtn);

// 저장된 테마 복원
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    darkBtn.textContent = '\u2600\ufe0f';
}

darkBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkBtn.textContent = isDark ? '\u2600\ufe0f' : '\ud83c\udf19';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ===== 5. 타이핑 효과 (헤더 부제목) =====
const subtitle = document.querySelector('header hgroup p');
if (subtitle) {
    const fullText = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.borderRight = '2px solid #4285f4';

    let i = 0;
    function typeChar() {
        if (i < fullText.length) {
            subtitle.textContent += fullText.charAt(i);
            i++;
            setTimeout(typeChar, 60);
        } else {
            // 커서 깜빡임 후 제거
            setTimeout(() => {
                subtitle.style.borderRight = 'none';
            }, 1500);
        }
    }
    setTimeout(typeChar, 500);
}

// ===== 6. 숫자 카운트업 애니메이션 (성적표) =====
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const cells = entry.target.querySelectorAll('tbody td, tfoot td');
            cells.forEach(cell => {
                const num = parseFloat(cell.textContent);
                if (!isNaN(num) && num > 0) {
                    animateNumber(cell, num);
                }
            });
            countObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('#table table:first-of-type').forEach(table => {
    countObserver.observe(table);
});

function animateNumber(el, target) {
    const duration = 1000;
    const start = performance.now();
    const isFloat = target % 1 !== 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = eased * target;

        el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ===== 7. progress 바 애니메이션 =====
const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progress = entry.target;
            const target = parseInt(progress.getAttribute('value'));
            progress.value = 0;
            let current = 0;

            const interval = setInterval(() => {
                current += 1;
                progress.value = current;
                if (current >= target) clearInterval(interval);
            }, 15);

            progressObserver.unobserve(progress);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('progress').forEach(p => progressObserver.observe(p));

// ===== 8. meter 애니메이션 =====
const meterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const meter = entry.target;
            const target = parseFloat(meter.getAttribute('value'));
            meter.value = 0;
            let current = 0;

            const interval = setInterval(() => {
                current += 0.01;
                meter.value = Math.min(current, target);
                if (current >= target) clearInterval(interval);
            }, 15);

            meterObserver.unobserve(meter);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('meter').forEach(m => meterObserver.observe(m));

// ===== 9. Canvas 애니메이션 (바운싱 볼) =====
const canvas = document.getElementById('myCanvas');
if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const balls = [
        { x: 50, y: 50, r: 20, dx: 2.5, dy: 1.8, color: '#4285f4' },
        { x: 150, y: 80, r: 15, dx: -2, dy: 2.2, color: '#ea4335' },
        { x: 250, y: 40, r: 18, dx: 1.5, dy: -2, color: '#fbbc04' },
        { x: 100, y: 100, r: 12, dx: -1.8, dy: -1.5, color: '#34a853' },
    ];

    function drawBalls() {
        ctx.clearRect(0, 0, W, H);

        // 배경 그라데이션
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#f8f9fa');
        grad.addColorStop(1, '#e8eaed');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        balls.forEach(b => {
            // 그림자
            ctx.beginPath();
            ctx.arc(b.x + 3, b.y + 3, b.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fill();

            // 공
            const ballGrad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
            ballGrad.addColorStop(0, '#fff');
            ballGrad.addColorStop(1, b.color);
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fillStyle = ballGrad;
            ctx.fill();

            // 이동
            b.x += b.dx;
            b.y += b.dy;

            if (b.x - b.r <= 0 || b.x + b.r >= W) b.dx *= -1;
            if (b.y - b.r <= 0 || b.y + b.r >= H) b.dy *= -1;
        });

        // 텍스트
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Canvas Animation', W / 2 - 48, H - 8);

        requestAnimationFrame(drawBalls);
    }
    drawBalls();
}

// ===== 10. dialog 열기/닫기 =====
const dialogOpenBtn = document.getElementById('dialogOpen');
const dialogCloseBtn = document.getElementById('dialogClose');
const myDialog = document.getElementById('myDialog');

if (dialogOpenBtn && myDialog) {
    dialogOpenBtn.addEventListener('click', () => {
        myDialog.showModal();
    });
}

if (dialogCloseBtn && myDialog) {
    dialogCloseBtn.addEventListener('click', () => {
        myDialog.close();
    });
}

// ===== 11. 드래그 앤 드롭 =====
const draggable = document.querySelector('.draggable-item');
if (draggable) {
    // 드롭존 생성
    const dropZone = document.createElement('div');
    dropZone.id = 'dropZone';
    dropZone.textContent = '\uc5ec\uae30\uc5d0 \ub4dc\ub86d\ud558\uc138\uc694';
    draggable.parentElement.appendChild(dropZone);

    draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', '');
        draggable.classList.add('dragging');
    });

    draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        dropZone.textContent = '\ub4dc\ub86d \uc644\ub8cc!';
        dropZone.classList.add('dropped');
        setTimeout(() => {
            dropZone.textContent = '\uc5ec\uae30\uc5d0 \ub4dc\ub86d\ud558\uc138\uc694';
            dropZone.classList.remove('dropped');
        }, 1500);
    });
}

// ===== 11. 색상 선택기 실시간 미리보기 =====
const colorInput = document.getElementById('color');
if (colorInput) {
    const preview = document.createElement('span');
    preview.id = 'colorPreview';
    preview.textContent = colorInput.value;
    colorInput.parentElement.insertBefore(preview, colorInput.nextSibling);

    colorInput.addEventListener('input', () => {
        preview.style.background = colorInput.value;
        preview.textContent = colorInput.value;
        // 밝기에 따라 텍스트 색상 변경
        const hex = colorInput.value.slice(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        preview.style.color = brightness > 128 ? '#333' : '#fff';
    });

    // 초기 상태
    preview.style.background = colorInput.value;
    const hex = colorInput.value.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    preview.style.color = brightness > 128 ? '#333' : '#fff';
}

// ===== 12. textarea 글자 수 카운터 =====
const textarea = document.getElementById('bio');
if (textarea) {
    const counter = document.createElement('div');
    counter.id = 'charCounter';
    counter.textContent = '0 / 500';
    textarea.parentElement.insertBefore(counter, textarea.nextSibling);

    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = len + ' / 500';
        counter.classList.toggle('warn', len > 450);
        counter.classList.toggle('full', len >= 500);
    });
}

// ===== 13. 비밀번호 강도 표시 =====
const passwordInput = document.getElementById('password');
if (passwordInput) {
    const strengthBar = document.createElement('div');
    strengthBar.id = 'strengthBar';
    const strengthFill = document.createElement('div');
    strengthFill.id = 'strengthFill';
    const strengthText = document.createElement('span');
    strengthText.id = 'strengthText';
    strengthBar.appendChild(strengthFill);
    passwordInput.parentElement.insertBefore(strengthBar, passwordInput.nextSibling);
    passwordInput.parentElement.insertBefore(strengthText, strengthBar.nextSibling);

    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        let score = 0;
        if (val.length >= 4) score++;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        const labels = ['', '\ub9e4\uc6b0 \uc57d\ud568', '\uc57d\ud568', '\ubcf4\ud1b5', '\uac15\ud568', '\ub9e4\uc6b0 \uac15\ud568'];
        const colors = ['', '#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
        const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];

        strengthFill.style.width = widths[score];
        strengthFill.style.background = colors[score];
        strengthText.textContent = val.length > 0 ? labels[score] : '';
        strengthText.style.color = colors[score];
    });
}

// ===== 14. 폼 제출 방지 + 토스트 알림 =====
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('\ud3fc\uc774 \uc81c\ucd9c\ub418\uc5c8\uc2b5\ub2c8\ub2e4! (\uc608\uc2dc)');
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2500);
}

// ===== 15. 표 행 정렬 (클릭하여 정렬) =====
const sortableTable = document.querySelector('#table table:first-of-type');
if (sortableTable) {
    const headers = sortableTable.querySelectorAll('thead th');
    headers.forEach((th, index) => {
        th.style.cursor = 'pointer';
        th.title = '\ud074\ub9ad\ud558\uc5ec \uc815\ub82c';
        let asc = true;

        th.addEventListener('click', () => {
            const tbody = sortableTable.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            rows.sort((a, b) => {
                const aVal = a.cells[index].textContent.trim();
                const bVal = b.cells[index].textContent.trim();
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return asc ? aNum - bNum : bNum - aNum;
                }
                return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });

            rows.forEach(row => {
                row.classList.add('sort-flash');
                tbody.appendChild(row);
            });

            setTimeout(() => rows.forEach(r => r.classList.remove('sort-flash')), 400);

            // 방향 표시
            headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(asc ? 'sort-asc' : 'sort-desc');
            asc = !asc;
        });
    });
}

// ===== 16. SVG 인터랙션 =====
const svgRect = document.querySelector('svg rect');
const svgCircle = document.querySelector('svg circle');

if (svgRect) {
    svgRect.style.cursor = 'pointer';
    svgRect.style.transition = 'all 0.3s';
    svgRect.addEventListener('click', () => {
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];
        const current = svgRect.getAttribute('fill');
        const next = colors[(colors.indexOf(current) + 1) % colors.length];
        svgRect.setAttribute('fill', next);
    });
}

if (svgCircle) {
    svgCircle.style.cursor = 'pointer';
    let big = false;
    svgCircle.addEventListener('click', () => {
        big = !big;
        svgCircle.setAttribute('r', big ? 48 : 40);
    });
}

// ===== 17. range 슬라이더 output 연동 (기존 코드 개선) =====
const range = document.getElementById('score');
const output = document.querySelector('output[for="score"]');
if (range && output) {
    range.addEventListener('input', () => {
        output.textContent = range.value;
    });
}

// ===== 18. 헤더 스크롤 시 고정 + 축소 =====
const headerEl = document.querySelector('header');
const headerHeight = headerEl.offsetHeight;
let lastScroll = 0;

const stickyNav = document.createElement('div');
stickyNav.id = 'stickyNav';
stickyNav.innerHTML = headerEl.querySelector('nav').innerHTML;
document.body.appendChild(stickyNav);

window.addEventListener('scroll', () => {
    if (window.scrollY > headerHeight + 100) {
        stickyNav.classList.add('sticky-show');
    } else {
        stickyNav.classList.remove('sticky-show');
    }
});

// 스티키 네비 클릭 이벤트
stickyNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== 19. 이미지 라이트박스 =====
document.querySelectorAll('section img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox';

        const clone = img.cloneNode();
        clone.style.cursor = 'zoom-out';
        overlay.appendChild(clone);

        overlay.addEventListener('click', () => {
            overlay.classList.remove('lightbox-show');
            overlay.addEventListener('transitionend', () => overlay.remove());
        });

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('lightbox-show'));
    });
});

// ===== 20. 제목 태그 크기 비교 바 애니메이션 =====
const headingSection = document.getElementById('heading');
if (headingSection) {
    const headings = headingSection.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(h => {
        const bar = document.createElement('span');
        bar.className = 'heading-bar';
        const level = parseInt(h.tagName.charAt(1));
        bar.style.setProperty('--bar-width', (100 - (level - 1) * 15) + '%');
        h.prepend(bar);
    });
}
