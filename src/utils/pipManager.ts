// Picture-in-Picture manager to provide an OS-level always-on-top floating timer
// that stays visible on top of any desktop application, external PDF viewer, or full-screen window.
// Uses real HTML/DOM Document Picture-in-Picture or Popup Window (NO video/canvas live stream).

import { SubjectType } from '../types';
import { formatDigitalTime } from './timerUtils';

export interface PiPCallbacks {
  onPlayPause: () => void;
  onNextQuestion: () => void;
  onSetQuestionNumber: (num: number) => void;
  onSetSubject: (sub: SubjectType) => void;
  onResetQuestion: () => void;
  onClose: () => void;
}

export interface PiPData {
  questionNumber: number;
  questionSeconds: number;
  totalSeconds: number;
  subject: SubjectType;
  isActive: boolean;
  isPaused: boolean;
  lastLapDuration?: number;
  mode?: 'stopwatch' | 'timer';
  targetSecondsPerQuestion?: number;
  aimedQuestions?: number;
  sessionTargetSeconds?: number;
}

class PictureInPictureManager {
  private pipWindow: Window | null = null;
  private callbacks: PiPCallbacks | null = null;
  private currentData: PiPData | null = null;
  private isPiPActive = false;

  public isSupported(): boolean {
    return (
      'documentPictureInPicture' in window ||
      typeof window.open === 'function'
    );
  }

  public getIsActive(): boolean {
    return this.isPiPActive;
  }

  // Open Document Picture-in-Picture or Popup Window with minimal size (NO video/canvas)
  public async openDocumentPiP(
    callbacks: PiPCallbacks,
    initialData: PiPData
  ): Promise<boolean> {
    this.callbacks = callbacks;
    this.currentData = initialData;

    let targetWin: Window | null = null;

    // 1. Try Document Picture-in-Picture (Real HTML Window, not a video)
    if ('documentPictureInPicture' in window) {
      try {
        // @ts-ignore
        targetWin = await window.documentPictureInPicture.requestWindow({
          width: 220,
          height: 56,
        });
      } catch (err) {
        console.warn('Document PiP request rejected, falling back to popup window', err);
      }
    }

    // 2. If Document PiP is unavailable or throws, open a mini popup window (NOT a video)
    if (!targetWin) {
      try {
        const left = Math.max(20, (window.screen?.availWidth || 800) - 260);
        const top = Math.max(20, (window.screen?.availHeight || 600) - 120);
        targetWin = window.open(
          '',
          'jee_pip_timer',
          `width=224,height=58,top=${top},left=${left},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
        );
      } catch (e) {
        console.warn('Popup window blocked', e);
      }
    }

    if (!targetWin) {
      alert('Unable to open floating window. Please allow popups or use Google Chrome for always-on-top Document PiP.');
      return false;
    }

    this.pipWindow = targetWin;
    this.isPiPActive = true;
    this.setupWindowDOM(targetWin, initialData);

    return true;
  }

  private setupWindowDOM(win: Window, initialData: PiPData) {
    const doc = win.document;
    doc.title = `Q#${initialData.questionNumber} - JEE Stopwatch`;

    const style = doc.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
        user-select: none;
        -webkit-user-select: none;
      }
      html, body {
        height: 100%;
        width: 100%;
        overflow: hidden;
        background: #090d16;
        color: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pip-hud {
        height: 100%;
        width: 100%;
        max-width: 224px;
        max-height: 56px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 3px 5px;
        background: #090d16;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        position: relative;
        box-sizing: border-box;
      }

      /* Ambient glowing top accent line */
      .pip-accent-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
      }
      .accent-phy { background: #38bdf8; }
      .accent-chem { background: #34d399; }
      .accent-math { background: #fb7185; }

      /* Row 1: Subject Selector + Total Session Time */
      .pip-row-1 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 16px;
        gap: 3px;
      }

      .sub-group {
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        padding: 1px;
        gap: 1px;
      }
      .btn-sub {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 8px;
        font-weight: 800;
        padding: 1px 3.5px;
        border-radius: 2px;
        cursor: pointer;
        line-height: 1;
      }
      .btn-sub:hover {
        color: #ffffff;
      }
      .btn-sub.active-phy {
        background: #0284c7;
        color: #ffffff;
      }
      .btn-sub.active-chem {
        background: #059669;
        color: #ffffff;
      }
      .btn-sub.active-math {
        background: #e11d48;
        color: #ffffff;
      }

      .row-1-right {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .btn-reset-q {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        border-radius: 2px;
        font-size: 7.5px;
        font-weight: 700;
        padding: 0.5px 3px;
        cursor: pointer;
      }
      .btn-reset-q:hover {
        color: #f87171;
        border-color: #f87171;
      }
      .total-session {
        font-size: 8.5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #94a3b8;
        white-space: nowrap;
      }

      /* Row 2: Question Stepper, Stopwatch & Action Buttons */
      .pip-row-2 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 25px;
        gap: 3px;
      }

      /* Question Changer controls */
      .q-changer {
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        overflow: hidden;
        height: 19px;
      }
      .btn-q-arrow {
        background: transparent;
        border: none;
        color: #cbd5e1;
        font-size: 8.5px;
        font-weight: 900;
        padding: 0 3px;
        height: 100%;
        cursor: pointer;
      }
      .btn-q-arrow:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }
      .btn-q-num {
        background: transparent;
        border: none;
        color: #38bdf8;
        font-size: 9.5px;
        font-weight: 800;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 0 2.5px;
        height: 100%;
        cursor: pointer;
      }
      .btn-q-num:hover {
        background: rgba(56, 189, 248, 0.2);
        color: #ffffff;
      }

      /* Center Stopwatch */
      .timer-center {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .big-stopwatch {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #ffffff;
        line-height: 1;
      }

      /* Action buttons */
      .actions-group {
        display: flex;
        align-items: center;
        gap: 2.5px;
      }
      .pip-btn {
        border: none;
        border-radius: 3px;
        padding: 2px 5px;
        font-weight: 800;
        font-size: 9px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 20px;
      }
      .btn-pp {
        min-width: 30px;
      }
      .btn-running {
        background: #d97706;
        color: #ffffff;
      }
      .btn-stopped {
        background: #059669;
        color: #ffffff;
      }
      .btn-finish-next {
        background: #2563eb;
        color: #ffffff;
        min-width: 44px;
      }
      .pip-btn:hover {
        filter: brightness(1.15);
      }
      .pip-btn:active {
        transform: scale(0.96);
      }
    `;
    doc.head.appendChild(style);

    const isRunning = initialData.isActive && !initialData.isPaused;
    const sub = initialData.subject;
    const accentClass = sub === 'physics' ? 'accent-phy' : sub === 'chemistry' ? 'accent-chem' : 'accent-math';

    doc.body.innerHTML = `
      <div class="pip-hud">
        <div id="pip-accent-bar" class="pip-accent-bar ${accentClass}"></div>

        <!-- Row 1: Subject Switcher + Reset + Total Time -->
        <div class="pip-row-1">
          <div class="sub-group">
            <button id="pip-sub-phy" class="btn-sub ${sub === 'physics' ? 'active-phy' : ''}" title="Switch to Physics (S)">PHY</button>
            <button id="pip-sub-chem" class="btn-sub ${sub === 'chemistry' ? 'active-chem' : ''}" title="Switch to Chemistry (S)">CHEM</button>
            <button id="pip-sub-math" class="btn-sub ${sub === 'math' ? 'active-math' : ''}" title="Switch to Math (S)">MATH</button>
          </div>

          <div class="row-1-right">
            <button id="pip-btn-reset" class="btn-reset-q" title="Reset Question Timer to 0 (R)">↺ Reset</button>
            <span class="total-session" id="pip-total-time">Σ ${formatDigitalTime(initialData.totalSeconds)}</span>
          </div>
        </div>

        <!-- Row 2: Question Stepper + Stopwatch + Action Buttons -->
        <div class="pip-row-2">
          <div class="q-changer">
            <button id="pip-btn-prev-q" class="btn-q-arrow" title="Previous Question (◀)">◀</button>
            <button id="pip-btn-q-num" class="btn-q-num" title="Click to Change Question #">Q#<span id="pip-q-val">${initialData.questionNumber}</span></button>
            <button id="pip-btn-next-q" class="btn-q-arrow" title="Next Question (▶)">▶</button>
          </div>

          <div class="timer-center">
            <span class="big-stopwatch" id="pip-big-timer">${formatDigitalTime(initialData.questionSeconds)}</span>
          </div>

          <div class="actions-group">
            <button id="pip-btn-pp" class="pip-btn btn-pp ${isRunning ? 'btn-running' : 'btn-stopped'}" title="Play / Pause (Space)">
              ${isRunning ? '❚❚' : '▶'}
            </button>
            <button id="pip-btn-next" class="pip-btn btn-finish-next" title="Finish & Next Question (Enter)">
              Next ➔
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const subPhy = doc.getElementById('pip-sub-phy');
    if (subPhy) {
      subPhy.onclick = () => {
        if (this.callbacks) this.callbacks.onSetSubject('physics');
      };
    }
    const subChem = doc.getElementById('pip-sub-chem');
    if (subChem) {
      subChem.onclick = () => {
        if (this.callbacks) this.callbacks.onSetSubject('chemistry');
      };
    }
    const subMath = doc.getElementById('pip-sub-math');
    if (subMath) {
      subMath.onclick = () => {
        if (this.callbacks) this.callbacks.onSetSubject('math');
      };
    }

    const resetBtn = doc.getElementById('pip-btn-reset');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (this.callbacks) this.callbacks.onResetQuestion();
      };
    }

    const ppBtn = doc.getElementById('pip-btn-pp');
    if (ppBtn) {
      ppBtn.onclick = () => {
        if (this.callbacks) this.callbacks.onPlayPause();
      };
    }

    const nextBtn = doc.getElementById('pip-btn-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.callbacks) this.callbacks.onNextQuestion();
      };
    }

    const prevQBtn = doc.getElementById('pip-btn-prev-q');
    if (prevQBtn) {
      prevQBtn.onclick = () => {
        if (this.callbacks && this.currentData) {
          const prevNum = Math.max(1, this.currentData.questionNumber - 1);
          this.callbacks.onSetQuestionNumber(prevNum);
        }
      };
    }

    const nextQBtn = doc.getElementById('pip-btn-next-q');
    if (nextQBtn) {
      nextQBtn.onclick = () => {
        if (this.callbacks && this.currentData) {
          const nextNum = this.currentData.questionNumber + 1;
          this.callbacks.onSetQuestionNumber(nextNum);
        }
      };
    }

    const qNumBtn = doc.getElementById('pip-btn-q-num');
    if (qNumBtn) {
      qNumBtn.onclick = () => {
        if (this.callbacks && this.currentData) {
          const input = win.prompt(
            'Change Question Number (1-999):',
            String(this.currentData.questionNumber)
          );
          if (input !== null) {
            const parsed = parseInt(input.trim(), 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 999) {
              this.callbacks.onSetQuestionNumber(parsed);
            }
          }
        }
      };
    }

    // Keyboard shortcuts inside floating window
    win.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.callbacks) this.callbacks.onPlayPause();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (this.callbacks) this.callbacks.onNextQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (this.callbacks && this.currentData) {
          this.callbacks.onSetQuestionNumber(Math.max(1, this.currentData.questionNumber - 1));
        }
      } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (this.callbacks && this.currentData) {
          this.callbacks.onSetQuestionNumber(this.currentData.questionNumber + 1);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (this.callbacks && this.currentData) {
          const cur = this.currentData.subject;
          const nextSub: SubjectType =
            cur === 'physics' ? 'chemistry' : cur === 'chemistry' ? 'math' : 'physics';
          this.callbacks.onSetSubject(nextSub);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (this.callbacks) this.callbacks.onResetQuestion();
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (this.callbacks && this.currentData) {
          const input = win.prompt(
            'Change Question Number (1-999):',
            String(this.currentData.questionNumber)
          );
          if (input !== null) {
            const parsed = parseInt(input.trim(), 10);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 999) {
              this.callbacks.onSetQuestionNumber(parsed);
            }
          }
        }
      }
    });

    win.addEventListener('pagehide', () => {
      this.pipWindow = null;
      this.isPiPActive = false;
      if (this.callbacks) this.callbacks.onClose();
    });

    win.addEventListener('beforeunload', () => {
      this.pipWindow = null;
      this.isPiPActive = false;
      if (this.callbacks) this.callbacks.onClose();
    });
  }

  // Update live values in whichever window is active
  public update(data: PiPData) {
    this.currentData = data;
    if (!this.isPiPActive || !this.pipWindow || this.pipWindow.closed) {
      if (this.isPiPActive && (!this.pipWindow || this.pipWindow.closed)) {
        this.isPiPActive = false;
        if (this.callbacks) this.callbacks.onClose();
      }
      return;
    }

    const doc = this.pipWindow.document;

    const qVal = doc.getElementById('pip-q-val');
    if (qVal) {
      qVal.textContent = data.aimedQuestions
        ? `${data.questionNumber}/${data.aimedQuestions}`
        : String(data.questionNumber);
    }

    const bigTimer = doc.getElementById('pip-big-timer');
    if (bigTimer) {
      if (data.mode === 'timer' && data.targetSecondsPerQuestion) {
        const remaining = data.targetSecondsPerQuestion - data.questionSeconds;
        if (remaining >= 0) {
          bigTimer.textContent = formatDigitalTime(remaining);
          bigTimer.style.color = remaining <= 15 ? '#fbbf24' : '#ffffff';
        } else {
          bigTimer.textContent = `+${formatDigitalTime(data.questionSeconds - data.targetSecondsPerQuestion)}`;
          bigTimer.style.color = '#f87171';
        }
      } else {
        bigTimer.textContent = formatDigitalTime(data.questionSeconds);
        bigTimer.style.color = '#ffffff';
      }
    }

    const totalTime = doc.getElementById('pip-total-time');
    if (totalTime) {
      if (data.sessionTargetSeconds && data.sessionTargetSeconds > 0) {
        const remaining = data.sessionTargetSeconds - data.totalSeconds;
        if (remaining >= 0) {
          totalTime.textContent = `⏳ ${formatDigitalTime(remaining)}`;
          totalTime.style.color = remaining <= 300 ? '#f59e0b' : '#38bdf8';
        } else {
          totalTime.textContent = `+${formatDigitalTime(data.totalSeconds - data.sessionTargetSeconds)}`;
          totalTime.style.color = '#f87171';
        }
      } else {
        totalTime.textContent = `Σ ${formatDigitalTime(data.totalSeconds)}`;
        totalTime.style.color = '#94a3b8';
      }
    }

    const ppBtn = doc.getElementById('pip-btn-pp');
    if (ppBtn) {
      const isRunning = data.isActive && !data.isPaused;
      ppBtn.className = `pip-btn btn-pp ${isRunning ? 'btn-running' : 'btn-stopped'}`;
      ppBtn.textContent = isRunning ? '❚❚' : '▶';
    }

    const subPhy = doc.getElementById('pip-sub-phy');
    const subChem = doc.getElementById('pip-sub-chem');
    const subMath = doc.getElementById('pip-sub-math');
    if (subPhy) subPhy.className = `btn-sub ${data.subject === 'physics' ? 'active-phy' : ''}`;
    if (subChem) subChem.className = `btn-sub ${data.subject === 'chemistry' ? 'active-chem' : ''}`;
    if (subMath) subMath.className = `btn-sub ${data.subject === 'math' ? 'active-math' : ''}`;

    const accentBar = doc.getElementById('pip-accent-bar');
    if (accentBar) {
      accentBar.className = `pip-accent-bar ${data.subject === 'physics' ? 'accent-phy' : data.subject === 'chemistry' ? 'accent-chem' : 'accent-math'}`;
    }
  }

  public close() {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
    this.isPiPActive = false;
  }
}

export const pipManager = new PictureInPictureManager();
