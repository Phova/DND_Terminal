interface Props {
  username: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onLogin: () => void;
  error: string;
}

export default function LoginScreen({ username, password, onUsernameChange, onPasswordChange, onLogin, error }: Props) {
  return (
    <div className="terminal-screen">
      <div className="login-container">
        <div className="login-runes">✦ ✦ ✦</div>
        <h1 className="login-title">DRAGONTAIL</h1>
        <p className="login-subtitle">越过龙脊山脉，踏入未知领域...</p>
        <div className="login-form">
          <input
            className="login-input"
            value={username}
            onChange={e => onUsernameChange(e.target.value)}
            placeholder="冒险者之名"
            onKeyDown={e => e.key === 'Enter' && onLogin()}
            autoFocus
          />
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
            placeholder="暗号"
            onKeyDown={e => e.key === 'Enter' && onLogin()}
          />
          <button className="login-btn" onClick={onLogin}>踏入冒险</button>
          {error && <p className="login-error">{error}</p>}
        </div>
        <div className="login-runes">✧ ✧ ✧</div>
      </div>
    </div>
  );
}
