// Supabase configuration
const SUPABASE_URL = 'https://yuddtnebiafcyuhcmfoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZGR0bmViaWFmY3l1aGNtZm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDc0ODYsImV4cCI6MjA2MTY4MzQ4Nn0.mA1o_ynHyO2Mn7QAzwvV743vh99hdmWO1OoX7AXjfj4';

// إنشاء عميل Supabase بالطريقة الصحيحة
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM elements
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const adminNavItem = document.getElementById('adminNavItem');
const adminPanel = document.getElementById('adminPanel');
const userDisplayName = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');

// Login and registration forms
const userLoginForm = document.getElementById('userLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const userRegisterForm = document.getElementById('userRegisterForm');
const showUserRegister = document.getElementById('showUserRegister');
const userRegisterCard = document.getElementById('userRegisterCard');
const cancelRegister = document.getElementById('cancelRegister');

// Player containers
const currentPlayersContainer = document.getElementById('currentPlayersContainer');
const retiredPlayersContainer = document.getElementById('retiredPlayersContainer');
const coachesContainer = document.getElementById('coachesContainer');
const adminTableBody = document.getElementById('adminTableBody');

// Modals
const addPersonModal = new bootstrap.Modal(document.getElementById('addPersonModal'));
const playerDetailsModal = new bootstrap.Modal(document.getElementById('playerDetailsModal'));
const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));

// Form elements
const personForm = document.getElementById('personForm');
const savePersonBtn = document.getElementById('savePersonBtn');
const addPreviousClubBtn = document.getElementById('addPreviousClubBtn');

// Current user state
let currentUser = null;
let isAdmin = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    // تحديد الوظائف المطلوبة على المستوى العالمي
    window.openImageModal = openImageModal; 
    window.viewPersonDetails = viewPersonDetails;
    window.editCountry = editCountry;
    window.deleteCountry = deleteCountry;
    window.editClub = editClub;
    window.deleteClub = deleteClub;
    
    // Check if user is already signed in
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        await handleAuthenticatedUser(user);
    }
    
    // إنشاء وملء جداول البيانات الأساسية إذا لم تكن موجودة
    await setupMasterData();
    
    // Load image preview functionality
    setupImagePreviewHandlers();
    
    // Load countries and clubs
    await loadCountries();
    await loadClubs();
    
    // تحميل جداول البيانات في نوافذ الإدارة
    if (isAdmin) {
        await loadCountriesTable();
        await loadClubsTable();
    }
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login forms
    userLoginForm.addEventListener('submit', handleUserLogin);
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Registration
    showUserRegister.addEventListener('click', toggleRegisterForm);
    cancelRegister.addEventListener('click', toggleRegisterForm);
    userRegisterForm.addEventListener('submit', handleUserRegistration);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Admin actions
    savePersonBtn.addEventListener('click', savePerson);
    addPreviousClubBtn.addEventListener('click', addPreviousClubField);
    
    // تحديث عنوان الأندية عند تغيير الفئة
    document.getElementById('personCategory').addEventListener('change', function(e) {
        updatePreviousClubsLabel(e.target.value);
    });
    
    // Country and Club management
    document.getElementById('saveCountryBtn').addEventListener('click', saveCountry);
    document.getElementById('resetCountryForm').addEventListener('click', resetCountryForm);
    document.getElementById('saveClubBtn').addEventListener('click', saveClub);
    document.getElementById('resetClubForm').addEventListener('click', resetClubForm);
    
    // إضافة مستمعي أحداث للإضافة الجماعية
    if (document.getElementById('showBulkCountryModalBtn')) {
        document.getElementById('showBulkCountryModalBtn').addEventListener('click', showBulkCountryModal);
    }
    if (document.getElementById('saveBulkCountriesBtn')) {
        document.getElementById('saveBulkCountriesBtn').addEventListener('click', saveBulkCountries);
    }
    if (document.getElementById('showBulkClubModalBtn')) {
        document.getElementById('showBulkClubModalBtn').addEventListener('click', showBulkClubModal);
    }
    if (document.getElementById('saveBulkClubsBtn')) {
        document.getElementById('saveBulkClubsBtn').addEventListener('click', saveBulkClubs);
    }
    
    // إضافة مستمعي أحداث للبحث
    if (document.getElementById('playerSearchBtn')) {
        document.getElementById('playerSearchBtn').addEventListener('click', searchPlayers);
    }
    
    // إضافة مستمع حدث للبحث عند الضغط على Enter في حقل البحث
    if (document.getElementById('playerSearchInput')) {
        document.getElementById('playerSearchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPlayers();
            }
        });
    }
    
    // Image previews for Countries and Clubs
    document.getElementById('countryFlag').addEventListener('change', function(e) {
        previewImage(e.target, 'flagPreview', 'flagPreviewContainer');
    });
    
    document.getElementById('clubLogo').addEventListener('change', function(e) {
        previewImage(e.target, 'logoPreview', 'logoPreviewContainer');
    });
}

// دالة لتحديث عنوان قسم الأندية حسب الفئة المحددة
function updatePreviousClubsLabel(category) {
    let previousClubsLabel = document.querySelector('label[for="previousClubsContainer"]');
    let addPreviousClubBtn = document.getElementById('addPreviousClubBtn');
    
    if (previousClubsLabel) {
        if (category === 'coach') {
            previousClubsLabel.textContent = 'الأندية التي دربها';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي قام بتدريبه';
            }
        } else if (category === 'retired') {
            previousClubsLabel.textContent = 'الأندية التي لعب لها';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي';
            }
        } else {
            previousClubsLabel.textContent = 'الأندية السابقة';
            if (addPreviousClubBtn) {
                addPreviousClubBtn.innerHTML = '<i class="fas fa-plus me-1"></i> إضافة نادي سابق';
            }
        }
    }
}

// Authentication functions
async function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // التحقق من تأكيد البريد الإلكتروني
        if (data.user && !data.user.email_confirmed_at) {
            // البريد الإلكتروني غير مؤكد
            alert('لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.');
            // يمكننا إما منع تسجيل الدخول أو السماح به مع قيود
            // للسماح بتسجيل الدخول مع التنبيه، نستمر بتنفيذ الكود
        }
        
        await handleAuthenticatedUser(data.user);
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // التحقق من تأكيد البريد الإلكتروني
        if (data.user && !data.user.email_confirmed_at) {
            // البريد الإلكتروني غير مؤكد
            alert('لم يتم تأكيد بريدك الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.');
            // للمسؤولين، قد ترغب في منع تسجيل الدخول تماماً حتى يتم تأكيد البريد الإلكتروني
            // await supabaseClient.auth.signOut();
            // return;
        }
        
        // Check if the user is an admin
        const { data: userData, error: userError } = await supabaseClient
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)
            .single();
        
        if (userError) throw userError;
        
        if (!userData.is_admin) {
            await supabaseClient.auth.signOut();
            alert('ليس لديك صلاحيات المسؤول');
            return;
        }
        
        isAdmin = true;
        await handleAuthenticatedUser(data.user);
    } catch (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
    }
}

async function handleUserRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('كلمات المرور غير متطابقة');
        return;
    }
    
    try {
        // تسجيل المستخدم في نظام المصادقة
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // بعض الإعدادات تستخدم محفز لإنشاء سجل profiles تلقائيًا
        // لتجنب الازدواجية، سنتحقق أولاً مما إذا كان السجل موجودًا
        const { data: existingProfile, error: checkError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
        // إذا لم يكن السجل موجودًا، قم بإدخاله يدويًا
        if (checkError && !existingProfile) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id, 
                        full_name: name, 
                        email: email,
                        is_admin: false
                    }
                ]);
            
            if (profileError && profileError.code !== '23505') { // رمز الخطأ للمفتاح المكرر
                throw profileError;
            }
        }
        
        // عرض رسالة تأكيد مع التنبيه بضرورة تأكيد البريد الإلكتروني
        alert('تم إنشاء الحساب بنجاح! تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.');
        toggleRegisterForm();
    } catch (error) {
        alert('خطأ في إنشاء الحساب: ' + error.message);
    }
}

async function handleAuthenticatedUser(user) {
    currentUser = user;
    
    // Get user profile
    const { data: userData, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (!error && userData) {
        isAdmin = userData.is_admin;
    }
    
    // Update UI based on user role
    userDisplayName.textContent = user.user_metadata?.full_name || userData?.full_name || user.email;
    adminNavItem.classList.toggle('d-none', !isAdmin);
    
    // Load football personalities data
    await loadFootballData();
    
    // Show app and hide login
    loginSection.classList.add('d-none');
    appSection.classList.remove('d-none');
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    isAdmin = false;
    
    // Reset UI
    appSection.classList.add('d-none');
    loginSection.classList.remove('d-none');
    adminPanel.classList.add('d-none');
    
    // Clear forms
    userLoginForm.reset();
    adminLoginForm.reset();
    userRegisterForm.reset();
}

function toggleRegisterForm() {
    userRegisterCard.classList.toggle('d-none');
}

// Data loading functions
async function loadFootballData() {
    await Promise.all([
        loadPlayersByCategory('current', currentPlayersContainer),
        loadPlayersByCategory('retired', retiredPlayersContainer),
        loadPlayersByCategory('coach', coachesContainer)
    ]);
    
    if (isAdmin) {
        await loadAdminTable();
    }
}

async function loadPlayersByCategory(category, container) {
    try {
        const { data: persons, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('category', category);
        
        if (error) throw error;
        
        container.innerHTML = '';
        
        if (persons.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>لا توجد بيانات متاحة</p></div>';
            return;
        }
        
        persons.forEach(person => {
            container.appendChild(createPersonCard(person));
        });
    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = '<div class="col-12 text-center"><p>حدث خطأ أثناء تحميل البيانات</p></div>';
    }
}

async function loadAdminTable() {
    try {
        const { data: persons, error } = await supabaseClient
            .from('football_persons')
            .select('*');
        
        if (error) throw error;
        
        adminTableBody.innerHTML = '';
        
        persons.forEach(person => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><img src="${person.image_url}" alt="${person.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 5px;"></td>
                <td>${person.name}</td>
                <td class="d-none d-md-table-cell">${person.age}</td>
                <td class="d-none d-md-table-cell">
                    <div class="d-flex align-items-center">
                        <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img" style="width: 35px; height: 25px; object-fit: contain; margin-left: 5px;">
                        ${person.nationality}
                    </div>
                </td>
                <td class="d-none d-md-table-cell">${getCategoryName(person.category)}</td>
                <td class="d-none d-md-table-cell">
                    ${person.current_club ? `
                    <div class="d-flex align-items-center">
                        <img src="${person.current_club_logo}" alt="${person.current_club}" class="club-logo" style="width: 35px; height: 35px; object-fit: contain; margin-left: 5px;">
                        ${person.current_club}
                    </div>` : '-'}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-sm btn-primary me-1" onclick="editPerson('${person.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletePerson('${person.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            adminTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading admin data:', error);
        adminTableBody.innerHTML = '<tr><td colspan="7" class="text-center">حدث خطأ أثناء تحميل البيانات</td></tr>';
    }
}

// دالة createPersonCard لإنشاء بطاقة لاعب
function createPersonCard(person) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 col-6 mb-4';
    
    // تحديد ما إذا كان يجب عرض النادي الحالي (فقط للاعبين الحاليين والمدربين)
    const showCurrentClub = person.category !== 'retired';
    
    col.innerHTML = `
        <div class="card player-card h-100">
            <div class="player-image-container" onclick="openImageModal(event, '${person.image_url}', '${person.name}')">
                <img src="${person.image_url}" class="card-img-top" alt="${person.name}" onclick="event.stopPropagation(); openImageModal(event, '${person.image_url}', '${person.name}')">
                <div class="player-image-overlay">
                    <i class="fas fa-search-plus zoom-icon"></i>
                    <span class="d-none d-md-block">اضغط لتكبير الصورة</span>
                </div>
            </div>
            <div class="card-body player-info">
                <h5 class="card-title player-name">${person.name}</h5>
                <div class="player-details">
                    <div class="nationality">
                        <strong>الجنسية:</strong>
                        <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img">
                        <span>${person.nationality}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-alt me-2"></i>
                        <strong>العمر:</strong>
                        <span>${person.age} سنة</span>
                    </div>
                    ${(showCurrentClub && person.current_club) ? `
                    <div class="detail-item">
                        <i class="fas fa-futbol me-2"></i>
                        <strong>النادي:</strong>
                        <div class="d-flex align-items-center">
                            <img src="${person.current_club_logo}" alt="${person.current_club}" class="club-logo">
                            <span>${person.current_club}</span>
                        </div>
                    </div>` : ''}
                </div>
                <button class="btn btn-primary w-100 mt-3" onclick="viewPersonDetails('${person.id}')">
                    <i class="fas fa-info-circle me-1 d-none d-sm-inline"></i>عرض التفاصيل
                </button>
            </div>
        </div>
    `;
    
    return col;
}

function getCategoryName(category) {
    switch(category) {
        case 'current': return 'لاعب حالي';
        case 'retired': return 'لاعب معتزل';
        case 'coach': return 'مدرب';
        default: return category;
    }
}

// Modal functions
function openImageModal(event, imageUrl, imageTitle) {
    console.log("Opening modal for image:", imageUrl);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const imgSrc = imageUrl || (event && event.target ? event.target.src : null);
    const title = imageTitle || (event && event.target ? event.target.alt : '');
    
    if (!imgSrc) {
        console.error("No image source found");
        return;
    }
    
    // تغيير مصدر الصورة وعنوان المودال
    const fullscreenImage = document.getElementById('fullscreenImage');
    const imageModalTitle = document.getElementById('imageModalTitle');
    
    if (fullscreenImage) fullscreenImage.src = imgSrc;
    if (imageModalTitle) imageModalTitle.textContent = title;
    
    // استخدام طريقة مباشرة لفتح المودال
    try {
        const modalElement = document.getElementById('imageModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error("Error showing modal:", error);
    }
}

async function viewPersonDetails(id) {
    try {
        const { data: person, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const { data: previousClubs, error: clubsError } = await supabaseClient
            .from('previous_clubs')
            .select('*')
            .eq('person_id', id);
        
        if (clubsError) throw clubsError;
        
        const detailsContent = document.getElementById('playerDetailsContent');
        const detailsTitle = document.getElementById('playerDetailsTitle');
        
        detailsTitle.textContent = person.name;
        
        // تحديد ما إذا كان يجب عرض النادي الحالي (فقط للاعبين الحاليين والمدربين)
        const showCurrentClub = person.category !== 'retired';
        
        // تغيير عنوان الأندية حسب فئة الشخص
        let clubsTitle;
        if (person.category === 'retired') {
            clubsTitle = 'الأندية التي لعب لها';
        } else if (person.category === 'coach') {
            clubsTitle = 'الأندية التي دربها';
        } else {
            clubsTitle = 'الأندية السابقة';
        }
        
        let clubsHtml = '';
        if (previousClubs && previousClubs.length > 0) {
            clubsHtml = `
                <div class="mt-4">
                    <h6 class="details-subtitle">${clubsTitle}:</h6>
                    <div class="club-history">
                        ${previousClubs.map(club => `
                            <div class="club-badge">
                                <img src="${club.logo_url}" alt="${club.name}" class="club-logo">
                                <span>${club.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        let achievementsHtml = '';
        if (person.achievements) {
            const achievementsList = person.achievements.split(',').map(a => a.trim());
            achievementsHtml = `
                <div class="mt-4">
                    <h6 class="details-subtitle">الإنجازات:</h6>
                    <div>
                        ${achievementsList.map(achievement => `
                            <span class="achievement-badge">${achievement}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        detailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="player-image-details">
                        <img src="${person.image_url}" alt="${person.name}" class="img-fluid rounded player-full-image" onclick="openImageModal(event, '${person.image_url}', '${person.name}')">
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="player-details-info">
                        <h4 class="mb-4 text-center text-md-right">${person.name}</h4>
                        
                        <div class="details-section">
                            <div class="detail-row">
                                <div class="detail-label">الجنسية:</div>
                                <div class="detail-value">
                                    <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img">
                                    <span>${person.nationality}</span>
                                </div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">العمر:</div>
                                <div class="detail-value">${person.age} سنة</div>
                            </div>
                            
                            <div class="detail-row">
                                <div class="detail-label">الفئة:</div>
                                <div class="detail-value">${getCategoryName(person.category)}</div>
                            </div>
                            
                            ${(showCurrentClub && person.current_club) ? `
                            <div class="detail-row">
                                <div class="detail-label">النادي الحالي:</div>
                                <div class="detail-value">
                                    <img src="${person.current_club_logo}" alt="${person.current_club}" class="club-logo">
                                    <span>${person.current_club}</span>
                                </div>
                            </div>` : ''}
                        </div>
                        
                        ${clubsHtml}
                        ${achievementsHtml}
                    </div>
                </div>
            </div>
        `;
        
        playerDetailsModal.show();
    } catch (error) {
        console.error('Error fetching person details:', error);
        alert('حدث خطأ أثناء تحميل تفاصيل الشخص');
    }
}

// Admin functions
async function savePerson() {
    if (!personForm.checkValidity()) {
        personForm.reportValidity();
        return;
    }
    
    // الحصول على القيم المحددة من القوائم المنسدلة
    const nationalitySelect = document.getElementById('personNationality');
    const currentClubSelect = document.getElementById('personCurrentClub');
    const categorySelect = document.getElementById('personCategory');
    const selectedCategory = categorySelect.value;
    
    // تعديل نص زر الإضافة بناءً على الفئة المحددة
    const addClubBtnText = selectedCategory === 'coach' ? 
        '<i class="fas fa-plus me-1"></i> إضافة نادي قام بتدريبه' : 
        '<i class="fas fa-plus me-1"></i> إضافة نادي سابق';
    
    document.getElementById('addPreviousClubBtn').innerHTML = addClubBtnText;
    
    // تغيير عنوان القسم بناءً على الفئة المحددة
    updatePreviousClubsLabel(selectedCategory);
    
    // الحصول على بيانات العلم وشعار النادي من خصائص data
    const selectedNationalityOption = nationalitySelect.options[nationalitySelect.selectedIndex];
    const selectedClubOption = currentClubSelect.selectedIndex > 0 ? 
                               currentClubSelect.options[currentClubSelect.selectedIndex] : 
                               null;
    
    const formData = {
        name: document.getElementById('personName').value,
        age: parseInt(document.getElementById('personAge').value),
        nationality: selectedNationalityOption.textContent,
        nationality_flag: selectedNationalityOption.getAttribute('data-flag'),
        category: document.getElementById('personCategory').value,
        current_club: null,
        current_club_logo: null,
        achievements: document.getElementById('personAchievements').value
    };
    
    // التحقق مما إذا كان خيار النادي الحالي هو "لا يوجد" أو نادي فعلي
    if (selectedClubOption) {
        if (selectedClubOption.value === "no_club") {
            // إذا كان الخيار هو "لا يوجد"، نترك القيم كـ null
            formData.current_club = null;
            formData.current_club_logo = null;
        } else {
            // إذا كان نادي فعلي، نأخذ الاسم والشعار
            formData.current_club = selectedClubOption.textContent;
            formData.current_club_logo = selectedClubOption.getAttribute('data-logo');
        }
    }
    
    const personId = document.getElementById('personId').value;
    const isNewPerson = !personId;
    
    try {
        // معالجة صورة الشخص فقط
        const imageFile = document.getElementById('personImage').files[0];
        
        if (imageFile) {
            // استخدام Supabase Storage لرفع الصورة
            const imagePath = `persons/${Date.now()}_${imageFile.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(imagePath, imageFile);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('images')
                .getPublicUrl(imagePath);
                
            formData.image_url = publicUrl;
        }
        
        // حفظ بيانات الشخص
        let newPersonId = personId;
        
        if (isNewPerson) {
            const { data, error } = await supabaseClient
                .from('football_persons')
                .insert([formData])
                .select();
                
            if (error) throw error;
            newPersonId = data[0].id;
        } else {
            const { error } = await supabaseClient
                .from('football_persons')
                .update(formData)
                .eq('id', personId);
                
            if (error) throw error;
        }
        
        // جمع بيانات الأندية السابقة من القوائم المنسدلة
        if (isNewPerson) {
            const clubEntries = document.querySelectorAll('.previous-club-entry');
            
            for (const entry of clubEntries) {
                const clubSelect = entry.querySelector('.previous-club-select');
                
                if (clubSelect.selectedIndex > 0) {
                    const selectedOption = clubSelect.options[clubSelect.selectedIndex];
                    
                    // تجاهل الخيار "لا يوجد" عند حفظ الأندية السابقة
                    if (selectedOption.value !== "no_club") {
                        const { error } = await supabaseClient
                            .from('previous_clubs')
                            .insert([{
                                person_id: newPersonId,
                                name: selectedOption.textContent,
                                logo_url: selectedOption.getAttribute('data-logo')
                            }]);
                            
                        if (error) throw error;
                    }
                }
            }
        }
        
        alert(isNewPerson ? 'تمت إضافة الشخص بنجاح' : 'تم تحديث الشخص بنجاح');
        addPersonModal.hide();
        personForm.reset();
        
        // إعادة تحميل البيانات
        await loadFootballData();
    } catch (error) {
        console.error('Error saving person:', error);
        alert('حدث خطأ أثناء حفظ البيانات: ' + error.message);
    }
}

async function editPerson(id) {
    try {
        const { data: person, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Populate the form
        document.getElementById('personId').value = person.id;
        document.getElementById('personName').value = person.name;
        document.getElementById('personAge').value = person.age;
        
        // تحديد الجنسية
        const nationalitySelect = document.getElementById('personNationality');
        for (let i = 0; i < nationalitySelect.options.length; i++) {
            if (nationalitySelect.options[i].textContent === person.nationality) {
                nationalitySelect.selectedIndex = i;
                break;
            }
        }
        
        document.getElementById('personCategory').value = person.category;
        
        // تحديد النادي الحالي
        const currentClubSelect = document.getElementById('personCurrentClub');
        if (person.current_club) {
            for (let i = 0; i < currentClubSelect.options.length; i++) {
                if (currentClubSelect.options[i].textContent === person.current_club) {
                    currentClubSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        document.getElementById('personAchievements').value = person.achievements || '';
        
        // Update modal title
        document.getElementById('personModalTitle').textContent = 'تعديل بيانات الشخص';
        
        // Show image preview if available
        if (person.image_url) {
            document.getElementById('imagePreview').src = person.image_url;
            document.getElementById('imagePreviewContainer').classList.remove('d-none');
        }
        
        // Open the modal
        addPersonModal.show();
    } catch (error) {
        console.error('Error editing person:', error);
        alert('حدث خطأ أثناء تحميل بيانات الشخص: ' + error.message);
    }
}

async function deletePerson(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        return;
    }
    
    try {
        // Delete previous clubs first
        const { error: clubsError } = await supabaseClient
            .from('previous_clubs')
            .delete()
            .eq('person_id', id);
            
        if (clubsError) throw clubsError;
        
        // Then delete the person
        const { error } = await supabaseClient
            .from('football_persons')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف الشخص بنجاح');
        await loadFootballData();
    } catch (error) {
        console.error('Error deleting person:', error);
        alert('حدث خطأ أثناء حذف الشخص: ' + error.message);
    }
}

function addPreviousClubField() {
    const container = document.getElementById('previousClubsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'row mb-2 previous-club-entry';
    
    newRow.innerHTML = `
        <div class="col-md-10">
            <select class="form-select previous-club-select" data-bs-toggle="tooltip" title="اختر نادي سابق">
                <option value="" selected disabled>اختر النادي</option>
            </select>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger remove-club-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // تعبئة القائمة الجديدة بالأندية
    loadClubsForSelect(newRow.querySelector('.previous-club-select'));
    
    // إضافة مستمع لزر الحذف
    newRow.querySelector('.remove-club-btn').addEventListener('click', function() {
        container.removeChild(newRow);
    });
}

// إضافة دوال جديدة للإضافة الجماعية للمنتخبات والأندية
async function showBulkCountryModal() {
    // عرض مودال إضافة دول بشكل جماعي
    const modal = new bootstrap.Modal(document.getElementById('bulkCountryModal'));
    modal.show();
}

async function saveBulkCountries() {
    try {
        const countriesText = document.getElementById('bulkCountriesText').value;
        if (!countriesText.trim()) {
            alert('يرجى إدخال بيانات الدول');
            return;
        }
        
        // تقسيم النص إلى أسطر
        const countriesLines = countriesText.trim().split('\n');
        const countries = [];
        
        // معالجة كل سطر
        for (const line of countriesLines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const countryName = parts[0].trim();
                const flagUrl = parts[1].trim();
                
                if (countryName && flagUrl) {
                    countries.push({
                        name: countryName,
                        flag_url: flagUrl
                    });
                }
            }
        }
        
        if (countries.length === 0) {
            alert('لم يتم العثور على بيانات صالحة. تأكد من الصيغة: اسم الدولة, رابط العلم');
            return;
        }
        
        // إضافة الدول إلى قاعدة البيانات
        const { data, error } = await supabaseClient
            .from('countries')
            .insert(countries);
            
        if (error) throw error;
        
        alert(`تم إضافة ${countries.length} دولة بنجاح`);
        document.getElementById('bulkCountriesText').value = '';
        
        // إغلاق المودال
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkCountryModal'));
        modal.hide();
        
        // تحديث الجداول والقوائم
        await loadCountriesTable();
        await loadCountries();
    } catch (error) {
        console.error('Error adding bulk countries:', error);
        alert('حدث خطأ أثناء إضافة الدول: ' + error.message);
    }
}

async function showBulkClubModal() {
    // عرض مودال إضافة أندية بشكل جماعي
    const modal = new bootstrap.Modal(document.getElementById('bulkClubModal'));
    modal.show();
}

async function saveBulkClubs() {
    try {
        const clubsText = document.getElementById('bulkClubsText').value;
        if (!clubsText.trim()) {
            alert('يرجى إدخال بيانات الأندية');
            return;
        }
        
        // تقسيم النص إلى أسطر
        const clubsLines = clubsText.trim().split('\n');
        const clubs = [];
        
        // معالجة كل سطر
        for (const line of clubsLines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const clubName = parts[0].trim();
                const logoUrl = parts[1].trim();
                
                if (clubName && logoUrl) {
                    clubs.push({
                        name: clubName,
                        logo_url: logoUrl
                    });
                }
            }
        }
        
        if (clubs.length === 0) {
            alert('لم يتم العثور على بيانات صالحة. تأكد من الصيغة: اسم النادي, رابط الشعار');
            return;
        }
        
        // إضافة الأندية إلى قاعدة البيانات
        const { data, error } = await supabaseClient
            .from('clubs')
            .insert(clubs);
            
        if (error) throw error;
        
        alert(`تم إضافة ${clubs.length} نادي بنجاح`);
        document.getElementById('bulkClubsText').value = '';
        
        // إغلاق المودال
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkClubModal'));
        modal.hide();
        
        // تحديث الجداول والقوائم
        await loadClubsTable();
        await loadClubs();
    } catch (error) {
        console.error('Error adding bulk clubs:', error);
        alert('حدث خطأ أثناء إضافة الأندية: ' + error.message);
    }
}

// دالة مساعدة لتعبئة قائمة منسدلة واحدة بالأندية
async function loadClubsForSelect(select) {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        select.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
        
        // إضافة خيار "لا يوجد"
        const noClubOption = document.createElement('option');
        noClubOption.value = "no_club";
        noClubOption.textContent = "لا يوجد";
        select.appendChild(noClubOption);
        
        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club.id;
            option.setAttribute('data-logo', club.logo_url);
            option.textContent = club.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clubs for select:', error);
    }
}

// إضافة دوال لتحميل الدول والأندية
async function loadCountries() {
    try {
        const { data: countries, error } = await supabaseClient
            .from('countries')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const nationalitySelect = document.getElementById('personNationality');
        nationalitySelect.innerHTML = '<option value="" selected disabled>اختر الجنسية</option>';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            
            // تحديث رابط العلم ليستخدم مشروع Supabase الجديد
            let flagUrl = country.flag_url;
            if (flagUrl && flagUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                // استبدال الرابط القديم بالرابط الجديد
                flagUrl = flagUrl.replace(
                    'ubmfyjpqvpihwgzdfwht.supabase.co', 
                    'yuddtnebiafcyuhcmfoo.supabase.co'
                );
            }
            
            option.setAttribute('data-flag', flagUrl);
            option.textContent = country.name;
            nationalitySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading countries:', error);
        alert('حدث خطأ أثناء تحميل قائمة الدول');
    }
}

async function loadClubs() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        // تعبئة قائمة النادي الحالي
        const currentClubSelect = document.getElementById('personCurrentClub');
        currentClubSelect.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
        
        // إضافة خيار "لا يوجد"
        const noClubOption = document.createElement('option');
        noClubOption.value = "no_club";
        noClubOption.textContent = "لا يوجد";
        currentClubSelect.appendChild(noClubOption);
        
        clubs.forEach(club => {
            // تحديث رابط شعار النادي ليستخدم مشروع Supabase الجديد
            let logoUrl = club.logo_url;
            if (logoUrl && logoUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                // استبدال الرابط القديم بالرابط الجديد
                logoUrl = logoUrl.replace(
                    'ubmfyjpqvpihwgzdfwht.supabase.co', 
                    'yuddtnebiafcyuhcmfoo.supabase.co'
                );
            }
            
            const option = document.createElement('option');
            option.value = club.id;
            option.setAttribute('data-logo', logoUrl);
            option.textContent = club.name;
            currentClubSelect.appendChild(option);
        });
        
        // تعبئة قوائم الأندية السابقة
        const previousClubSelects = document.querySelectorAll('.previous-club-select');
        previousClubSelects.forEach(select => {
            select.innerHTML = '<option value="" selected disabled>اختر النادي</option>';
            
            // إضافة خيار "لا يوجد" للقوائم المنسدلة للأندية السابقة
            const noClubOption = document.createElement('option');
            noClubOption.value = "no_club";
            noClubOption.textContent = "لا يوجد";
            select.appendChild(noClubOption);
            
            clubs.forEach(club => {
                // تحديث رابط شعار النادي ليستخدم مشروع Supabase الجديد
                let logoUrl = club.logo_url;
                if (logoUrl && logoUrl.includes('ubmfyjpqvpihwgzdfwht.supabase.co')) {
                    // استبدال الرابط القديم بالرابط الجديد
                    logoUrl = logoUrl.replace(
                        'ubmfyjpqvpihwgzdfwht.supabase.co', 
                        'yuddtnebiafcyuhcmfoo.supabase.co'
                    );
                }
                
                const option = document.createElement('option');
                option.value = club.id;
                option.setAttribute('data-logo', logoUrl);
                option.textContent = club.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading clubs:', error);
        alert('حدث خطأ أثناء تحميل قائمة الأندية');
    }
}

// Image preview handlers
function setupImagePreviewHandlers() {
    // Main player image preview
    document.getElementById('personImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('imagePreview').src = e.target.result;
                document.getElementById('imagePreviewContainer').classList.remove('d-none');
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Add event listeners for existing remove club buttons
    document.querySelectorAll('.remove-club-btn').forEach(button => {
        button.addEventListener('click', function() {
            const entry = this.closest('.previous-club-entry');
            entry.parentNode.removeChild(entry);
        });
    });
}

// Execute these functions after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (this.getAttribute('href') === '#adminPanel') {
                document.getElementById('playerCategories').classList.add('d-none');
                document.getElementById('adminPanel').classList.remove('d-none');
            } else if (this.getAttribute('href') === '#playerCategories') {
                document.getElementById('adminPanel').classList.add('d-none');
                document.getElementById('playerCategories').classList.remove('d-none');
            }
        });
    });
});

// إضافة دالة لإنشاء وملء جداول الدول والأندية
async function setupMasterData() {
    try {
        // التحقق من وجود جدول الدول وملئه إذا كان فارغاً
        const { data: countriesData, error: countriesError } = await supabaseClient
            .from('countries')
            .select('count', { count: 'exact', head: true });
            
        if (!countriesError) {
            // تحقق مما إذا كان الجدول فارغاً
            const { count, error: countError } = await supabaseClient
                .from('countries')
                .select('*', { count: 'exact', head: true });
                
            if (!countError && count === 0) {
                console.log('إضافة بيانات الدول...');
                
                // إضافة بيانات الدول
                await supabaseClient.from('countries').insert([
                    { name: 'السعودية', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg' },
                    { name: 'مصر', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Egypt.svg' },
                    { name: 'الإمارات', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_United_Arab_Emirates.svg' },
                    { name: 'قطر', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg' },
                    { name: 'البرازيل', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg' },
                    { name: 'الأرجنتين', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg' },
                    { name: 'فرنسا', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg' },
                    { name: 'إسبانيا', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Spain.svg' },
                    { name: 'إنجلترا', flag_url: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Flag_of_England.svg' }
                ]);
            }
        } else {
            console.log('جدول الدول غير موجود، يرجى إنشاؤه من لوحة تحكم Supabase');
        }
        
        // التحقق من وجود جدول الأندية وملئه إذا كان فارغاً
        const { data: clubsData, error: clubsError } = await supabaseClient
            .from('clubs')
            .select('count', { count: 'exact', head: true });
            
        if (!clubsError) {
            // تحقق مما إذا كان الجدول فارغاً
            const { count, error: countError } = await supabaseClient
                .from('clubs')
                .select('*', { count: 'exact', head: true });
                
            if (!countError && count === 0) {
                console.log('إضافة بيانات الأندية...');
                
                // إضافة بيانات الأندية
                await supabaseClient.from('clubs').insert([
                    { name: 'الهلال', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/c/c7/Al_Hilal_logo.svg' },
                    { name: 'النصر', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/f/f3/Al_Nassr_logo.svg' },
                    { name: 'الأهلي', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/d/dd/Al-Ahli_Saudi_FC_logo.svg' },
                    { name: 'الاتحاد', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/2/24/Ittihad_FC.png' },
                    { name: 'برشلونة', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/4/47/FC_Barcelona.svg' },
                    { name: 'ريال مدريد', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/9/98/Real_Madrid.png' },
                    { name: 'مانشستر يونايتد', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/7/7a/Manchester_United_FC_crest.svg' },
                    { name: 'ليفربول', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/0/0c/Liverpool_FC.svg' },
                    { name: 'باريس سان جيرمان', logo_url: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Paris_Saint-Germain_F.C..svg' }
                ]);
            }
        } else {
            console.log('جدول الأندية غير موجود، يرجى إنشاؤه من لوحة تحكم Supabase');
        }
        
        console.log('تم فحص جداول البيانات الأساسية');
    } catch (error) {
        console.error('خطأ في التحقق من البيانات الأساسية:', error);
    }
}

// تحديث دالة تنشيط مستمعات أحداث الصور
function attachImageClickEvents(container) {
    // لم نعد بحاجة إلى هذه الدالة لأننا الآن نستخدم onclick مباشرة
    // هذه الدالة موجودة فقط للتوافق مع الكود الموجود
}

// وظائف إدارة الجنسيات
async function loadCountriesTable() {
    try {
        const { data: countries, error } = await supabaseClient
            .from('countries')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const tableBody = document.getElementById('countriesTableBody');
        tableBody.innerHTML = '';
        
        countries.forEach(country => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${country.flag_url}" alt="${country.name}" style="width: 60px; height: 40px; object-fit: contain;"></td>
                <td>${country.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editCountry('${country.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCountry('${country.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading countries table:', error);
        alert('حدث خطأ أثناء تحميل بيانات الدول');
    }
}

async function saveCountry() {
    if (!document.getElementById('countryName').value) {
        alert('يرجى إدخال اسم الدولة');
        return;
    }
    
    try {
        const countryId = document.getElementById('countryId').value;
        const countryName = document.getElementById('countryName').value;
        const countryFlag = document.getElementById('countryFlag').files[0];
        
        const formData = {
            name: countryName
        };
        
        // رفع الصورة إذا تم تحديدها
        if (countryFlag) {
            const flagPath = `flags/${Date.now()}_${countryFlag.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(flagPath, countryFlag);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('images')
                .getPublicUrl(flagPath);
                
            formData.flag_url = publicUrl;
        }
        
        if (countryId) {
            // تحديث دولة موجودة
            const { error } = await supabaseClient
                .from('countries')
                .update(formData)
                .eq('id', countryId);
                
            if (error) throw error;
            
            alert('تم تحديث الدولة بنجاح');
        } else {
            // إضافة دولة جديدة
            const { error } = await supabaseClient
                .from('countries')
                .insert([formData]);
                
            if (error) throw error;
            
            alert('تمت إضافة الدولة بنجاح');
        }
        
        resetCountryForm();
        await loadCountriesTable();
        await loadCountries(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error saving country:', error);
        alert('حدث خطأ أثناء حفظ بيانات الدولة: ' + error.message);
    }
}

function resetCountryForm() {
    document.getElementById('countryId').value = '';
    document.getElementById('countryName').value = '';
    document.getElementById('countryFlag').value = '';
    document.getElementById('flagPreviewContainer').classList.add('d-none');
}

async function editCountry(id) {
    try {
        const { data: country, error } = await supabaseClient
            .from('countries')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('countryId').value = country.id;
        document.getElementById('countryName').value = country.name;
        
        if (country.flag_url) {
            document.getElementById('flagPreview').src = country.flag_url;
            document.getElementById('flagPreviewContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error editing country:', error);
        alert('حدث خطأ أثناء تحميل بيانات الدولة: ' + error.message);
    }
}

async function deleteCountry(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الدولة؟')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('countries')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف الدولة بنجاح');
        await loadCountriesTable();
        await loadCountries(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error deleting country:', error);
        alert('حدث خطأ أثناء حذف الدولة: ' + error.message);
    }
}

// وظائف إدارة الأندية
async function loadClubsTable() {
    try {
        const { data: clubs, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .order('name');
            
        if (error) throw error;
        
        const tableBody = document.getElementById('clubsTableBody');
        tableBody.innerHTML = '';
        
        clubs.forEach(club => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${club.logo_url}" alt="${club.name}" style="width: 60px; height: 60px; object-fit: contain;"></td>
                <td>${club.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editClub('${club.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClub('${club.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading clubs table:', error);
        alert('حدث خطأ أثناء تحميل بيانات الأندية');
    }
}

async function saveClub() {
    if (!document.getElementById('clubName').value) {
        alert('يرجى إدخال اسم النادي');
        return;
    }
    
    try {
        const clubId = document.getElementById('clubId').value;
        const clubName = document.getElementById('clubName').value;
        const clubLogo = document.getElementById('clubLogo').files[0];
        
        const formData = {
            name: clubName
        };
        
        // رفع الصورة إذا تم تحديدها
        if (clubLogo) {
            const logoPath = `clubs/${Date.now()}_${clubLogo.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('images')
                .upload(logoPath, clubLogo);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('images')
                .getPublicUrl(logoPath);
                
            formData.logo_url = publicUrl;
        }
        
        if (clubId) {
            // تحديث نادي موجود
            const { error } = await supabaseClient
                .from('clubs')
                .update(formData)
                .eq('id', clubId);
                
            if (error) throw error;
            
            alert('تم تحديث النادي بنجاح');
        } else {
            // إضافة نادي جديد
            const { error } = await supabaseClient
                .from('clubs')
                .insert([formData]);
                
            if (error) throw error;
            
            alert('تمت إضافة النادي بنجاح');
        }
        
        resetClubForm();
        await loadClubsTable();
        await loadClubs(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error saving club:', error);
        alert('حدث خطأ أثناء حفظ بيانات النادي: ' + error.message);
    }
}

function resetClubForm() {
    document.getElementById('clubId').value = '';
    document.getElementById('clubName').value = '';
    document.getElementById('clubLogo').value = '';
    document.getElementById('logoPreviewContainer').classList.add('d-none');
}

async function editClub(id) {
    try {
        const { data: club, error } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('clubId').value = club.id;
        document.getElementById('clubName').value = club.name;
        
        if (club.logo_url) {
            document.getElementById('logoPreview').src = club.logo_url;
            document.getElementById('logoPreviewContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error editing club:', error);
        alert('حدث خطأ أثناء تحميل بيانات النادي: ' + error.message);
    }
}

async function deleteClub(id) {
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('clubs')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        alert('تم حذف النادي بنجاح');
        await loadClubsTable();
        await loadClubs(); // تحديث القوائم المنسدلة
    } catch (error) {
        console.error('Error deleting club:', error);
        alert('حدث خطأ أثناء حذف النادي: ' + error.message);
    }
}

// دوال البحث عن اللاعبين
async function searchPlayers() {
    const searchQuery = document.getElementById('playerSearchInput').value.trim();
    
    if (!searchQuery || searchQuery.length < 2) {
        alert('يرجى إدخال كلمة بحث لا تقل عن حرفين');
        return;
    }
    
    try {
        // البحث في قاعدة البيانات باستخدام الاستعلام
        const { data: results, error } = await supabaseClient
            .from('football_persons')
            .select('*')
            .ilike('name', `%${searchQuery}%`);
            
        if (error) throw error;
        
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const searchNoResults = document.getElementById('searchNoResults');
        
        searchResultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            // لا توجد نتائج
            searchNoResults.classList.remove('d-none');
        } else {
            // عرض النتائج
            searchNoResults.classList.add('d-none');
            
            results.forEach(person => {
                const searchCardCol = document.createElement('div');
                searchCardCol.className = 'col-md-4 mb-3';
                searchCardCol.innerHTML = createSearchResultCard(person);
                searchResultsContainer.appendChild(searchCardCol);
            });
        }
        
        // عرض مودال نتائج البحث
        const searchResultsModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
        searchResultsModal.show();
    } catch (error) {
        console.error('Error searching players:', error);
        alert('حدث خطأ أثناء البحث: ' + error.message);
    }
}

// دالة لإنشاء بطاقة نتيجة بحث
function createSearchResultCard(person) {
    // تحديد ما إذا كان يجب عرض النادي الحالي (فقط للاعبين الحاليين والمدربين)
    const showCurrentClub = person.category !== 'retired';
    
    return `
        <div class="card h-100 search-card">
            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                <span class="small">${getCategoryName(person.category)}</span>
                <img src="${person.nationality_flag}" alt="${person.nationality}" class="flag-img">
            </div>
            <div class="card-body text-center p-2 p-md-3">
                <img src="${person.image_url}" alt="${person.name}" class="img-fluid rounded mb-2" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" onclick="openImageModal(event, '${person.image_url}', '${person.name}')">
                <h5 class="card-title fs-6 fs-md-5 mb-1">${person.name}</h5>
                <p class="card-text small mb-1">
                    العمر: ${person.age} سنة
                    ${showCurrentClub && person.current_club ? `<br>النادي: ${person.current_club}` : ''}
                </p>
                <button class="btn btn-primary btn-sm mt-1" onclick="viewPersonDetails('${person.id}')">
                    <i class="fas fa-info-circle me-1 d-none d-sm-inline"></i>عرض التفاصيل
                </button>
            </div>
        </div>
    `;
} 