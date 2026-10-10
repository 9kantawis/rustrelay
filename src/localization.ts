import type { Language } from "../shared/contracts";

type Entry = { en: string; zh: string };
const copy: Record<string, Entry> = {
  Редко: { en: "Sparse", zh: "稀疏" },
  Обычно: { en: "Moderate", zh: "一般" },
  Часто: { en: "Dense", zh: "密集" },
  "Команда и твои метки на карте.": {
    en: "Your team and saved map pins.",
    zh: "队伍与已保存的地图标记。",
  },
  "Команды и автоматизация.": {
    en: "Commands and automation.",
    zh: "命令与自动化。",
  },
  "Сервер отклонил сопряжение. Нажми «Подключить Rust+» в игре ещё раз.": {
    en: "The server rejected pairing. Select Pair with Rust+ in game again.",
    zh: "服务器拒绝了配对。请在游戏中重新点击连接 Rust+。",
  },
  "Сервер отклонил запрос. Попробуй подключиться ещё раз.": {
    en: "The server rejected the request. Try connecting again.",
    zh: "服务器拒绝了请求。请重试连接。",
  },
  "Не удалось прочитать ответ Rust+. Попробуй подключиться ещё раз.": {
    en: "Could not read the Rust+ response. Try connecting again.",
    zh: "无法读取 Rust+ 响应。请重试连接。",
  },
  "Сервер Rust+ не отвечает. Попробуй подключиться позже.": {
    en: "The Rust+ server is not responding. Try again later.",
    zh: "Rust+ 服务器无响应。请稍后重试。",
  },
  "Сервер Rust+ недоступен. Проверь подключение к интернету.": {
    en: "The Rust+ server is unreachable. Check your internet connection.",
    zh: "无法访问 Rust+ 服务器。请检查网络连接。",
  },
  "Не удалось подключиться к Rust+. Попробуй ещё раз.": {
    en: "Could not connect to Rust+. Try again.",
    zh: "无法连接到 Rust+。请重试。",
  },
  Обновить: { en: "Reload", zh: "刷新" },
  "Не удалось открыть страницу входа. Проверь подключение и нажми «Обновить».":
    {
      en: "Could not open sign-in. Check your connection and select Reload.",
      zh: "无法打开登录页面。请检查网络连接并点击刷新。",
    },
  Назад: { en: "Back", zh: "返回" },
  Загрузка: { en: "Loading", zh: "正在加载" },
  "Не удалось завершить вход. Попробуй ещё раз.": {
    en: "Could not complete sign-in. Try again.",
    zh: "无法完成登录。请重试。",
  },
  "Не удалось зарегистрировать уведомления Google. Попробуй ещё раз.": {
    en: "Could not register Google notifications. Try again.",
    zh: "无法注册 Google 通知。请重试。",
  },
  "Не удалось зарегистрировать уведомления Expo. Попробуй ещё раз.": {
    en: "Could not register Expo notifications. Try again.",
    zh: "无法注册 Expo 通知。请重试。",
  },
  "Rust+ не принял подключение. Войди через Steam ещё раз.": {
    en: "Rust+ did not accept the connection. Sign in with Steam again.",
    zh: "Rust+ 未接受连接。请再次通过 Steam 登录。",
  },
  "Не удалось подключиться к уведомлениям Google. Нажми «Ждать сопряжение».": {
    en: "Could not connect to Google notifications. Select Wait for pairing.",
    zh: "无法连接到 Google 通知。请选择等待配对。",
  },
  "Связь с Google прервалась. Подключаемся снова.": {
    en: "Disconnected from Google. Reconnecting.",
    zh: "与 Google 的连接已断开。正在重新连接。",
  },
  "Не удалось подключиться к уведомлениям Google": {
    en: "Could not connect to Google notifications",
    zh: "无法连接到 Google 通知",
  },
  "Открыть вход снова": { en: "Reopen sign-in", zh: "重新打开登录" },
  "Отменить вход": { en: "Cancel sign-in", zh: "取消登录" },
  Обзор: { en: "Overview", zh: "概览" },
  Сервер: { en: "Server", zh: "服务器" },
  Серверы: { en: "Servers", zh: "服务器" },
  "Карта сервера": { en: "Server map", zh: "服务器地图" },
  "Команда и чат": { en: "Team and chat", zh: "团队与聊天" },
  "Моя база": { en: "My base", zh: "我的基地" },
  События: { en: "Events", zh: "事件" },
  Магазины: { en: "Shops", zh: "商店" },
  Инструменты: { en: "Tools", zh: "工具" },
  "Рейд-калькулятор": { en: "Raid calculator", zh: "突袭计算器" },
  "Крафт и переработка": { en: "Crafting and recycling", zh: "制作与回收" },
  Генетика: { en: "Genetics", zh: "基因" },
  "Таймер гниения": { en: "Decay timer", zh: "腐蚀计时器" },
  Монументы: { en: "Monuments", zh: "地标" },
  Настройки: { en: "Settings", zh: "设置" },
  "Сервер, база и инструменты.": {
    en: "Server, base, and tools.",
    zh: "服务器、基地和工具。",
  },
  "Команда, магазины и твои метки на карте.": {
    en: "Team, shops, and your map pins.",
    zh: "团队、商店和地图标记。",
  },
  "Кто в игре и что происходит у команды.": {
    en: "See who is online and what your team is doing.",
    zh: "查看谁在线以及团队动态。",
  },
  "Переключатели, сигнализации и запасы.": {
    en: "Switches, alarms, and storage.",
    zh: "开关、警报和储物箱。",
  },
  "История уведомлений и событий сервера.": {
    en: "Notification and server event history.",
    zh: "通知和服务器事件记录。",
  },
  "Найди нужный товар или выгодный обмен.": {
    en: "Find items and useful trades.",
    zh: "查找物品和划算的交易。",
  },
  "Рассчитай боеприпасы и ресурсы для рейда.": {
    en: "Calculate raid ammo and resources.",
    zh: "计算突袭弹药和资源。",
  },
  "Ингредиенты, затраты и выход ресурсов.": {
    en: "Ingredients, costs, and resource yield.",
    zh: "原料、成本和资源产出。",
  },
  "Подбери скрещивание из своих клонов.": {
    en: "Find the best crossbreed from your clones.",
    zh: "从克隆中寻找最佳杂交方案。",
  },
  "Рассчитай время гниения и сохрани напоминание.": {
    en: "Estimate decay time and save a reminder.",
    zh: "估算腐蚀时间并保存提醒。",
  },
  "Справочная информация по локациям Rust.": {
    en: "Reference information for Rust locations.",
    zh: "Rust 地点参考信息。",
  },
  "Подключение Rust+ и сохранённые серверы.": {
    en: "Rust+ pairing and saved servers.",
    zh: "Rust+ 配对和已保存服务器。",
  },
  "Интерфейс, уведомления и данные приложения.": {
    en: "Interface, notifications, and app data.",
    zh: "界面、通知和应用数据。",
  },
  "Не подключено": { en: "Disconnected", zh: "未连接" },
  "Подключение...": { en: "Connecting...", zh: "正在连接..." },
  Подключено: { en: "Connected", zh: "已连接" },
  "Ошибка подключения": { en: "Connection error", zh: "连接错误" },
  "Выбрать сервер": { en: "Choose server", zh: "选择服务器" },
  Поиск: { en: "Search", zh: "搜索" },
  "Найти раздел": { en: "Find a section", zh: "查找页面" },
  "Ничего не найдено": { en: "Nothing found", zh: "未找到结果" },
  "Подключить сервер": { en: "Connect server", zh: "连接服务器" },
  Свернуть: { en: "Minimize", zh: "最小化" },
  Развернуть: { en: "Maximize", zh: "最大化" },
  "Закрыть приложение": { en: "Close application", zh: "关闭应用" },
  "Начни с подключения": { en: "Start by connecting", zh: "先连接服务器" },
  "Подключи свой Rust.": { en: "Connect your Rust.", zh: "连接你的 Rust。" },
  "Войди через Steam и свяжи сервер с RustRelay. Карта, команда и устройства появятся здесь.":
    {
      en: "Sign in with Steam and pair a server with RustRelay. Your map, team, and devices will appear here.",
      zh: "使用 Steam 登录并将服务器与 RustRelay 配对。地图、团队和设备会显示在这里。",
    },
  "Войти через Steam": { en: "Sign in with Steam", zh: "使用 Steam 登录" },
  "Подключить Rust+ в игре": {
    en: "Connect Rust+ in game",
    zh: "在游戏中连接 Rust+",
  },
  "Выбрать сервер в RustRelay": {
    en: "Choose a server in RustRelay",
    zh: "在 RustRelay 中选择服务器",
  },
  Сводка: { en: "Summary", zh: "摘要" },
  "Текущий сервер": { en: "Current server", zh: "当前服务器" },
  "Сервер подключён": { en: "Server connected", zh: "服务器已连接" },
  "Карта, команда и устройства доступны через Rust+.": {
    en: "Map, team, and devices are available through Rust+.",
    zh: "可通过 Rust+ 使用地图、团队和设备。",
  },
  "Игроки на сервере": { en: "Players on server", zh: "服务器玩家" },
  "Команда в сети": { en: "Team online", zh: "在线队友" },
  Устройства: { en: "Devices", zh: "设备" },
  "Активные таймеры": { en: "Active timers", zh: "活动计时器" },
  "Время и напоминания": { en: "Timing and reminders", zh: "时间与提醒" },
  "Рассчитать рейд": { en: "Calculate raid", zh: "计算突袭" },
  "Цели и боеприпасы": { en: "Targets and ammunition", zh: "目标与弹药" },
  "Ингредиенты и ресурсы": {
    en: "Ingredients and resources",
    zh: "原料与资源",
  },
  "Подобрать гены": { en: "Find genes", zh: "选择基因" },
  "Клоны и скрещивание": { en: "Clones and crossbreeding", zh: "克隆与杂交" },
  "Открыть карту": { en: "Open map", zh: "打开地图" },
  "ПОДКЛЮЧЕНИЕ RUST+": { en: "RUST+ CONNECTION", zh: "RUST+ 连接" },
  "Подключение сервера": { en: "Connect a server", zh: "连接服务器" },
  "Войди через Steam, зайди на сервер в Rust и выбери «Подключить Rust+». Сервер появится в списке справа.":
    {
      en: "Sign in with Steam, join your Rust server, and choose “Pair with Rust+”. The server will appear on the right.",
      zh: "使用 Steam 登录，进入 Rust 服务器并选择“连接 Rust+”。服务器会显示在右侧。",
    },
  "Войди в Steam": { en: "Sign in to Steam", zh: "登录 Steam" },
  "Вход откроется здесь, на официальной странице Rust+.": {
    en: "Sign-in opens here, on the official Rust+ page.",
    zh: "登录将在此处的官方 Rust+ 页面中打开。",
  },
  "Открой меню Rust+ в игре": {
    en: "Open the Rust+ menu in game",
    zh: "在游戏中打开 Rust+ 菜单",
  },
  "Нажми кнопку подключения к текущему серверу.": {
    en: "Choose the pairing option for your current server.",
    zh: "选择当前服务器的配对选项。",
  },
  "Выбери сервер здесь": {
    en: "Choose the server here",
    zh: "在这里选择服务器",
  },
  "После подключения станут доступны карта и команда.": {
    en: "The map and team become available after pairing.",
    zh: "配对后即可使用地图和团队功能。",
  },
  "Вход ещё не выполнен": { en: "Not signed in yet", zh: "尚未登录" },
  "Заверши вход через Steam": {
    en: "Finish signing in with Steam",
    zh: "请通过 Steam 完成登录",
  },
  "Регистрируем уведомления": {
    en: "Setting up notifications",
    zh: "正在设置通知",
  },
  "Теперь нажми «Подключить Rust+» в игре": {
    en: "Now choose “Pair with Rust+” in game",
    zh: "现在请在游戏中选择“连接 Rust+”",
  },
  "Сервер добавлен": { en: "Server added", zh: "服务器已添加" },
  "Сопряжение не завершилось": {
    en: "Pairing did not finish",
    zh: "配对未完成",
  },
  "Ждать сопряжение": { en: "Wait for pairing", zh: "等待配对" },
  "Импорт JSON": { en: "Import JSON", zh: "导入 JSON" },
  "Ввести данные вручную": { en: "Enter details manually", zh: "手动输入信息" },
  "Скрыть ручной ввод": { en: "Hide manual entry", zh: "隐藏手动输入" },
  "Мои серверы": { en: "My servers", zh: "我的服务器" },
  Подключить: { en: "Connect", zh: "连接" },
  Отключить: { en: "Disconnect", zh: "断开连接" },
  "Здесь будет твой сервер": {
    en: "Your server will appear here",
    zh: "你的服务器会显示在这里",
  },
  "Добавь его через Steam или импортируй данные сопряжения.": {
    en: "Add it through Steam or import pairing data.",
    zh: "通过 Steam 添加或导入配对数据。",
  },
  "БЕЗОПАСНЫЙ ВХОД": { en: "SECURE SIGN-IN", zh: "安全登录" },
  "Подключить Steam": { en: "Connect Steam", zh: "连接 Steam" },
  "Откроется официальный сайт Rust+ в обычном браузере. RustRelay не видит пароль Steam. После входа браузер сам вернёт подтверждение приложению.":
    {
      en: "The official Rust+ site will open in your browser. RustRelay never sees your Steam password. After sign-in, the browser sends confirmation back to the app.",
      zh: "官方 Rust+ 网站将在浏览器中打开。RustRelay 无法看到你的 Steam 密码。登录后，浏览器会将确认结果返回应用。",
    },
  "Проверь адрес companion-rust.facepunch.com перед входом.": {
    en: "Check the companion-rust.facepunch.com address before signing in.",
    zh: "登录前请确认地址为 companion-rust.facepunch.com。",
  },
  "Продолжить в браузере": { en: "Continue in browser", zh: "在浏览器中继续" },
  Отмена: { en: "Cancel", zh: "取消" },
  "Интерфейс и запуск": { en: "Interface and startup", zh: "界面与启动" },
  "Язык интерфейса": { en: "Interface language", zh: "界面语言" },
  Русский: { en: "Russian", zh: "俄语" },
  Анимации: { en: "Animations", zh: "动画" },
  "Плавные переходы и появление элементов.": {
    en: "Smooth transitions and element entrances.",
    zh: "平滑的过渡和元素出现动画。",
  },
  "Прозрачные поверхности": { en: "Transparent surfaces", zh: "透明表面" },
  "Размытие фона у панелей, меню и верхней строки.": {
    en: "Blurred backgrounds for panels, menus, and the top bar.",
    zh: "面板、菜单和顶部栏使用背景模糊。",
  },
  Автозапуск: { en: "Start with Windows", zh: "开机自启" },
  "Запускать RustRelay после входа в Windows.": {
    en: "Start RustRelay after you sign in to Windows.",
    zh: "登录 Windows 后启动 RustRelay。",
  },
  "Работа в трее": { en: "System tray", zh: "系统托盘" },
  "Кнопка закрытия сворачивает приложение в системный трей.": {
    en: "The close button sends the app to the system tray.",
    zh: "关闭按钮会将应用最小化到系统托盘。",
  },
  "Команды в чате": { en: "Chat commands", zh: "聊天命令" },
  "Отвечать на команды прямо в игровом чате.": {
    en: "Reply to team commands in the in-game chat.",
    zh: "直接在游戏聊天中回复团队命令。",
  },
  "RustRelay продолжает следить за событиями, пока работает в системном трее.":
    {
      en: "RustRelay keeps watching events while it runs in the system tray.",
      zh: "RustRelay 在系统托盘运行时会继续监控事件。",
    },
  "Экспортировать данные без токенов": {
    en: "Export data without tokens",
    zh: "导出不含令牌的数据",
  },
  Уведомления: { en: "Notifications", zh: "通知" },
  "Уведомления Windows": { en: "Windows notifications", zh: "Windows 通知" },
  "Показывать системные уведомления.": {
    en: "Show system notifications.",
    zh: "显示系统通知。",
  },
  "Поверх всех окон": { en: "Above all windows", zh: "置于所有窗口之上" },
  "Показывать компактное уведомление, когда тебя нет на сервере.": {
    en: "Show a compact alert when you are not on the server.",
    zh: "当你不在服务器时显示紧凑提醒。",
  },
  "Уведомления Discord": { en: "Discord notifications", zh: "Discord 通知" },
  "Отправлять выбранные события в настроенный канал.": {
    en: "Send selected events to the configured channel.",
    zh: "将所选事件发送到已配置的频道。",
  },
  "ЧТО ПОКАЗЫВАТЬ": { en: "WHAT TO SHOW", zh: "显示内容" },
  "Тревоги и гибель": { en: "Alarms and deaths", zh: "警报与死亡" },
  "Статус команды": { en: "Team status", zh: "团队状态" },
  "Системные события": { en: "System events", zh: "系统事件" },
  "Канал Discord": { en: "Discord channel", zh: "Discord 频道" },
  "Вставь webhook своего канала. Он хранится с шифрованием Windows.": {
    en: "Paste your channel webhook. Windows encryption protects it.",
    zh: "粘贴频道 webhook。它会使用 Windows 加密保存。",
  },
  "Webhook канала": { en: "Channel webhook", zh: "频道 webhook" },
  "Новый webhook (текущий сохранён)": {
    en: "New webhook (current one is saved)",
    zh: "新 webhook（当前已保存）",
  },
  Сохранить: { en: "Save", zh: "保存" },
  "Отправить проверку": { en: "Send test", zh: "发送测试" },
  "Готово.": { en: "Done.", zh: "完成。" },
  "О приложении": { en: "About", zh: "关于" },
  "Мрачный парень.Любит паркур": {
    en: "A gloomy guy. Loves parkour.",
    zh: "阴郁的家伙。喜欢跑酷。",
  },
  "Подключи сервер, чтобы получить данные Rust+.": {
    en: "Connect a server to load Rust+ data.",
    zh: "连接服务器以加载 Rust+ 数据。",
  },
  "Обновить данные": { en: "Refresh data", zh: "刷新数据" },
  Команда: { en: "Team", zh: "团队" },
  Все: { en: "All", zh: "全部" },
  Таймеры: { en: "Timers", zh: "计时器" },
  Тревоги: { en: "Alerts", zh: "警报" },
  "Не в сети": { en: "Offline", zh: "离线" },
  "в сети": { en: "online", zh: "在线" },
  Жив: { en: "Alive", zh: "存活" },
  Погиб: { en: "Dead", zh: "阵亡" },
  Количество: { en: "Quantity", zh: "数量" },
  Название: { en: "Name", zh: "名称" },
  Материал: { en: "Material", zh: "材料" },
  "Квадрат карты": { en: "Map grid", zh: "地图网格" },
  "Множитель скорости распада": {
    en: "Decay rate multiplier",
    zh: "腐蚀速度倍率",
  },
  "Расчётное время истекло": {
    en: "Estimated time has elapsed",
    zh: "预计时间已结束",
  },
  "Проверь ввод": { en: "Check your input", zh: "请检查输入" },
  "Проверь гены": { en: "Check the genes", zh: "请检查基因" },
  "Адрес сервера": { en: "Server address", zh: "服务器地址" },
  Включить: { en: "Turn on", zh: "开启" },
  "Выбери сервер": { en: "Choose a server", zh: "选择服务器" },
  Выключить: { en: "Turn off", zh: "关闭" },
  "Гены центрального растения": {
    en: "Center plant genes",
    zh: "中心植物基因",
  },
  "Гены, по одному клону на строку": {
    en: "Genes, one clone per line",
    zh: "基因，每行一个克隆",
  },
  "Данные получены": { en: "Data received", zh: "已收到数据" },
  "Добавь от 2 до 16 клонов": {
    en: "Add 2 to 16 clones",
    zh: "添加 2 到 16 个克隆",
  },
  "Закрыть сообщение": { en: "Dismiss message", zh: "关闭消息" },
  "Каменная база": { en: "Stone base", zh: "石头基地" },
  Компонент: { en: "Component", zh: "组件" },
  "Нажми на карту": { en: "Click the map", zh: "点击地图" },
  "Название метки": { en: "Pin name", zh: "标记名称" },
  "Например, D5": { en: "For example, D5", zh: "例如 D5" },
  "Не удалось выполнить действие": {
    en: "The action could not be completed",
    zh: "无法完成操作",
  },
  "Нет товара": { en: "Out of stock", zh: "缺货" },
  "Нет тревоги": { en: "No alert", zh: "无警报" },
  "Нужное количество": { en: "Required amount", zh: "所需数量" },
  "Ожидаем данные": { en: "Waiting for data", zh: "等待数据" },
  "Ожидаем ответ": { en: "Waiting for response", zh: "等待响应" },
  "Основная навигация": { en: "Main navigation", zh: "主导航" },
  "Открой RustRelay как Windows-приложение": {
    en: "Open RustRelay as a Windows application",
    zh: "请以 Windows 应用方式打开 RustRelay",
  },
  Переключатели: { en: "Switches", zh: "开关" },
  "Поиск по ID предмета": { en: "Search by item ID", zh: "按物品 ID 搜索" },
  "ПОЛУЧИШЬ В СРЕДНЕМ": { en: "AVERAGE YIELD", zh: "平均产出" },
  "Порт Rust+": { en: "Rust+ port", zh: "Rust+ 端口" },
  "После подключения здесь появится настоящая карта сервера с командой и метками.":
    {
      en: "After connecting, the live server map, team, and pins will appear here.",
      zh: "连接后，此处将显示实时服务器地图、团队和标记。",
    },
  "Поставить метку": { en: "Place pin", zh: "放置标记" },
  ПОТРЕБУЕТСЯ: { en: "REQUIRED", zh: "需要" },
  "Предложения сервера": { en: "Server offers", zh: "服务器交易" },
  Предмет: { en: "Item", zh: "物品" },
  "Результат переработки": { en: "Recycling result", zh: "回收结果" },
  "Результаты поиска": { en: "Search results", zh: "搜索结果" },
  "Ресурсы на крафт": { en: "Crafting resources", zh: "制作资源" },
  "Сервер не подключён": { en: "Server is not connected", zh: "服务器未连接" },
  сервера: { en: "server", zh: "服务器" },
  Сигнализации: { en: "Alarms", zh: "警报器" },
  "Сигнализация сработала": { en: "Alarm triggered", zh: "警报已触发" },
  "Слой ресурсов": { en: "Resource layer", zh: "资源图层" },
  "Статус неизвестен": { en: "Status unknown", zh: "状态未知" },
  Тип: { en: "Type", zh: "类型" },
  "Тип переработчика": { en: "Recycler type", zh: "回收机类型" },
  "Токен сопряжения": { en: "Pairing token", zh: "配对令牌" },
  "Торговый автомат": { en: "Vending machine", zh: "自动售货机" },
  "Увеличить карту": { en: "Zoom in", zh: "放大地图" },
  "Уменьшить карту": { en: "Zoom out", zh: "缩小地图" },
  Хранилища: { en: "Storage", zh: "储物箱" },
  "Целевые гены": { en: "Target genes", zh: "目标基因" },
  "Что изготовить?": { en: "What do you want to craft?", zh: "要制作什么？" },
  "Что переработать?": {
    en: "What do you want to recycle?",
    zh: "要回收什么？",
  },
  "ID предмета": { en: "Item ID", zh: "物品 ID" },
  "ID устройства Rust+": { en: "Rust+ device ID", zh: "Rust+ 设备 ID" },
  "Steam ID (17 цифр)": { en: "Steam ID (17 digits)", zh: "Steam ID（17 位）" },
  "КОМАНДЫ ЧАТА": { en: "CHAT COMMANDS", zh: "聊天命令" },
  "Игроки и очередь сервера": {
    en: "Players and server queue",
    zh: "玩家与服务器队列",
  },
  "Дата последнего вайпа": { en: "Last wipe date", zh: "上次清档日期" },
  "Ресурсы для крафта": { en: "Crafting resources", zh: "制作所需资源" },
  "Оставшееся время гниения": {
    en: "Remaining decay time",
    zh: "剩余腐蚀时间",
  },
  "Запас ресурсов в шкафах": {
    en: "Resources stored in tool cupboards",
    zh: "领地柜中的资源储备",
  },
  "Чем рейдим сегодня?": {
    en: "What are we raiding with today?",
    zh: "今天用什么突袭？",
  },
  "Монументы на карте": { en: "Monuments on the map", zh: "地图地标" },
  "Подключи сервер, чтобы увидеть монументы на его карте.": {
    en: "Connect a server to see its map monuments.",
    zh: "连接服务器以查看地图地标。",
  },
  Помощник: { en: "Assistant", zh: "助手" },
  "Команды, события и автоматизация.": {
    en: "Commands, events, and automation.",
    zh: "命令、事件和自动化。",
  },
  Сетка: { en: "Grid", zh: "网格" },
  "Сетка карты": { en: "Map grid", zh: "地图网格" },
  "Слои карты": { en: "Map layers", zh: "地图图层" },
  "Интерактивная карта": { en: "Interactive map", zh: "交互式地图" },
  Хитмап: { en: "Heatmap", zh: "热力图" },
  "Закрыть хитмап": { en: "Close heatmap", zh: "关闭热力图" },
  Ресурс: { en: "Resource", zh: "资源" },
  Насыщенность: { en: "Intensity", zh: "强度" },
  "Насыщенность хитмапа": { en: "Heatmap intensity", zh: "热力图强度" },
  Реже: { en: "Less", zh: "较少" },
  Чаще: { en: "More", zh: "较多" },
  "Зоны спавна, без учёта уже добытых ресурсов.": {
    en: "Spawn areas; harvested resources are not tracked.",
    zh: "显示生成区域，不追踪已采集的资源。",
  },
  "Читаем карту Rust...": {
    en: "Reading Rust map...",
    zh: "正在读取 Rust 地图...",
  },
  "Открой этот сервер в Rust, чтобы загрузить карту.": {
    en: "Join this server in Rust to download its map.",
    zh: "在 Rust 中进入此服务器以下载地图。",
  },
  "Проверить карту": { en: "Check map", zh: "检查地图" },
  Руда: { en: "Ore", zh: "矿石" },
  Деревья: { en: "Trees", zh: "树木" },
  Брёвна: { en: "Logs", zh: "原木" },
  Ягоды: { en: "Berries", zh: "浆果" },
  Грибы: { en: "Mushrooms", zh: "蘑菇" },
  Кукуруза: { en: "Corn", zh: "玉米" },
  Тыквы: { en: "Pumpkins", zh: "南瓜" },
  Картофель: { en: "Potatoes", zh: "土豆" },
  "Мусорные кучи": { en: "Junk piles", zh: "垃圾堆" },
  Медведи: { en: "Bears", zh: "熊" },
  Волки: { en: "Wolves", zh: "狼" },
  Кабаны: { en: "Boars", zh: "野猪" },
  Лошади: { en: "Horses", zh: "马" },
  Олени: { en: "Deer", zh: "鹿" },
  "Добавить метку": { en: "Add pin", zh: "添加标记" },
  "Отменить метку": { en: "Cancel pin", zh: "取消标记" },
  "Удалить метку": { en: "Delete pin", zh: "删除标记" },
  "Предложения магазина": { en: "Shop offers", zh: "商店商品" },
  "Закрыть магазин": { en: "Close shop", zh: "关闭商店" },
  "В наличии": { en: "In stock", zh: "有库存" },
  "Нет предложений": { en: "No offers", zh: "暂无商品" },
  "Показать всю карту": { en: "Fit map", zh: "显示完整地图" },
  "Найти предмет": { en: "Find an item", zh: "搜索物品" },
  "Очистить уведомления": { en: "Clear notifications", zh: "清空通知" },
  "Удалить уведомление": { en: "Delete notification", zh: "删除通知" },
  "События мира": { en: "World events", zh: "世界事件" },
  "Загружаем помощника...": {
    en: "Loading assistant...",
    zh: "正在加载助手...",
  },
  Команды: { en: "Commands", zh: "命令" },
  Оповещения: { en: "Event alerts", zh: "事件提醒" },
  "Команды сервера": { en: "Server commands", zh: "服务器命令" },
  "Выбери команду справа": {
    en: "Choose a command on the right",
    zh: "从右侧选择命令",
  },
  "Команда помощника": { en: "Assistant command", zh: "助手命令" },
  "Выполнить команду": { en: "Run command", zh: "运行命令" },
  "Найти команду": { en: "Find a command", zh: "搜索命令" },
  Инструмент: { en: "Tool", zh: "工具" },
  Действие: { en: "Action", zh: "操作" },
  Выполнить: { en: "Run", zh: "运行" },
  Приложение: { en: "App", zh: "应用" },
  "Чат Rust": { en: "Rust chat", zh: "Rust 聊天" },
  "Псевдонимы команд": { en: "Command aliases", zh: "命令别名" },
  "Чёрный список": { en: "Blacklist", zh: "黑名单" },
  "Камеры CCTV": { en: "CCTV cameras", zh: "监控摄像头" },
  Гниение: { en: "Decay", zh: "腐蚀" },
  "Исчезновение предметов": { en: "Item despawn", zh: "物品消失" },
  "Все команды": { en: "All commands", zh: "全部命令" },
  Предметы: { en: "Items", zh: "物品" },
  "Лидер команды": { en: "Team leader", zh: "队长" },
  Изучение: { en: "Research", zh: "研究" },
  "Размер стака": { en: "Stack size", zh: "堆叠数量" },
  "Содержание базы": { en: "Base upkeep", zh: "基地维护" },
  "Время работы": { en: "Uptime", zh: "运行时间" },
  "Название предмета": { en: "Item name", zh: "物品名称" },
  Значение: { en: "Value", zh: "值" },
  Номер: { en: "Number", zh: "编号" },
  Иконка: { en: "Icon", zh: "图标" },
  "Выбери значение": { en: "Choose a value", zh: "选择值" },
  "По умолчанию": { en: "Default", zh: "默认" },
  "Сначала подключи сервер": {
    en: "Connect a server first",
    zh: "请先连接服务器",
  },
  "Введи команду": { en: "Enter a command", zh: "输入命令" },
  "Команда выполнена": { en: "Command completed", zh: "命令已完成" },
  "Команда не найдена. Выбери её из списка.": {
    en: "Unknown command. Choose one from the list.",
    zh: "未知命令。请从列表中选择。",
  },
  "База начала гнить": { en: "Base has started decaying", zh: "基地开始腐蚀" },
  "Монитор хранилища отключён": {
    en: "Storage monitor disconnected",
    zh: "存储监视器已断开",
  },
  "Хранилище недоступно": { en: "Storage is unavailable", zh: "存储不可用" },
  "Сигнализация недоступна": { en: "Alarm is unavailable", zh: "警报器不可用" },
  "Уведомление при обнаружении Грузового корабля.": {
    en: "When Cargo Ship is detected, send a notification.",
    zh: "发现货船",
  },
  "Уведомление когда Грузовой корабль покинет карту.": {
    en: "When Cargo Ship left the map, send a notification.",
    zh: "货船离开",
  },
  "Уведомление когда Грузовой корабль начнёт уплывать.": {
    en: "When Cargo Ship enters egress stage, send a notification.",
    zh: "货船即将离开",
  },
  "Уведомление когда грузовой корабль прибудет в порт.": {
    en: "When Cargo Ship is docked at a harbor, send a notification.",
    zh: "货船停靠港口",
  },
  "Уведомление когда патрульный вертолёт был обнаружен.": {
    en: "When Patrol Helicopter is detected, send a notification.",
    zh: "发现巡逻直升机",
  },
  "Уведомление когда патрульный вертолет покинет карту.": {
    en: "When Patrol Helicopter left the map, send a notification.",
    zh: "巡逻直升机离开",
  },
  "Уведомление когда патрульный вертолёт был уничтожен.": {
    en: "When Patrol Helicopter gets destroyed, send a notification.",
    zh: "巡逻直升机被击落",
  },
  "Уведомление при открытии запертого ящика на Нефтяной вышке.": {
    en: "When a Locked Crate at Oil Rig is unlocked, send a notification.",
    zh: "石油平台锁定箱已解锁",
  },
  "Уведомление при активации запертого ящика на Нефтяной Вышке.": {
    en: "When Heavy Scientists are called to Oil Rig, send a notification.",
    zh: "呼叫重装科学家",
  },
  "Уведомление при обнаружении Chinook 47.": {
    en: "When a Chinook 47 enters the map, send a notification.",
    zh: "发现 CH47 直升机",
  },
  "Уведомление при появлении Странствующего Торговца.": {
    en: "When the Traveling Vendor is detected, send a notification.",
    zh: "发现流动商贩",
  },
  "Уведомление при остановке Странствующего Торговца.": {
    en: "When the Traveling Vendor stops moving, send a notification.",
    zh: "流动商贩停车",
  },
  "Уведомление когда Странствующий Торговец покинет карту.": {
    en: "When the Traveling Vendor left the map, send a notification.",
    zh: "流动商贩离开",
  },
  "Уведомление при обнаружении нового Торгового Автомата.": {
    en: "When a new Vending Machine is detected, send a notification.",
    zh: "发现新商店",
  },
  "Команда и автоматизация": {
    en: "Command and automation",
    zh: "命令与自动化",
  },
  "Команда чата": { en: "Chat command", zh: "聊天命令" },
  Режим: { en: "Mode", zh: "模式" },
  Вручную: { en: "Manual", zh: "手动" },
  "Включать днём": { en: "On during the day", zh: "白天开启" },
  "Включать ночью": { en: "On at night", zh: "夜间开启" },
  "Всегда включён": { en: "Always on", zh: "始终开启" },
  "Всегда выключен": { en: "Always off", zh: "始终关闭" },
  "Включать, когда команда в сети": {
    en: "On while teammates are online",
    zh: "队友在线时开启",
  },
  "Включать, когда никого нет": {
    en: "On while everyone is offline",
    zh: "所有人离线时开启",
  },
  "Сохранить команду": { en: "Save command", zh: "保存命令" },
  "Группы переключателей": { en: "Switch groups", zh: "开关组" },
  "Создать группу": { en: "Create group", zh: "创建组" },
  "Удалить группу": { en: "Delete group", zh: "删除组" },
  "Название группы": { en: "Group name", zh: "组名" },
  "Команда группы": { en: "Group command", zh: "组命令" },
  Подписаться: { en: "Subscribe", zh: "订阅" },
  Отписаться: { en: "Unsubscribe", zh: "取消订阅" },
  Обычные: { en: "Static", zh: "静态" },
  Динамические: { en: "Dynamic", zh: "动态" },
  Показать: { en: "Show", zh: "显示" },
  Список: { en: "List", zh: "列表" },
  Изменить: { en: "Edit", zh: "编辑" },
  Найти: { en: "Find", zh: "搜索" },
  "Сервер не передаёт магазины и события через Rust+.": {
    en: "The server does not share shops or events through Rust+.",
    zh: "服务器不再通过 Rust+ 提供商店或事件数据。",
  },
  "Rust+ не передаёт магазины": {
    en: "Shop data is unavailable in Rust+",
    zh: "Rust+ 不再提供商店数据",
  },
  "Facepunch отключила данные магазинов и событий в обновлении от 6 августа 2026.":
    {
      en: "Facepunch removed shop and event data in the August 6, 2026 update.",
      zh: "Facepunch 在 2026 年 8 月 6 日的更新中移除了商店和事件数据。",
    },
};

export function translate(language: Language, visibleText: string) {
  const source =
    copy[visibleText] !== undefined
      ? visibleText
      : Object.entries(copy).find(
          ([, entry]) => entry.en === visibleText || entry.zh === visibleText,
        )?.[0] || visibleText;
  if (language === "ru") return source;
  return copy[source]?.[language] || source;
}

const translatedAttributes = ["aria-label", "placeholder", "title"];

function translateNode(root: Node, language: Language) {
  const nodes: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);
  if (root instanceof Element || root instanceof Document)
    nodes.push(
      ...Array.from(root.querySelectorAll("*"), (element) =>
        Array.from(element.childNodes).filter(
          (node): node is Text => node.nodeType === Node.TEXT_NODE,
        ),
      ).flat(),
    );
  for (const node of nodes) {
    const current = node.textContent || "";
    const trimmed = current.trim();
    if (!trimmed) continue;
    const translated = translate(language, trimmed);
    if (translated !== trimmed)
      node.textContent = current.replace(trimmed, translated);
  }
  if (!(root instanceof Element || root instanceof Document)) return;
  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(root.querySelectorAll("*"));
  for (const element of elements) {
    for (const name of translatedAttributes) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const translated = translate(language, current);
      if (translated !== current) element.setAttribute(name, translated);
    }
  }
}

export function installInterfaceTranslator(language: Language) {
  document.documentElement.lang =
    language === "zh" ? "zh-CN" : language === "en" ? "en" : "ru";
  translateNode(document, language);
  const observer = new MutationObserver((mutations) => {
    observer.disconnect();
    for (const mutation of mutations) {
      if (mutation.type === "characterData")
        translateNode(mutation.target, language);
      for (const node of mutation.addedNodes) translateNode(node, language);
    }
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  return () => observer.disconnect();
}
