import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Network, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공 - 로컬 스토리지에 저장
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // 페이지 새로고침을 통해 인증 상태 업데이트
        window.location.href = "/";
      } else {
        setError(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다.");
    }
    
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-gray-600" />
        <Button
          variant={language === 'ko' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('ko')}
        >
          {t('common', 'korean')}
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLanguage('en')}
        >
          {t('common', 'english')}
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Network className="w-8 h-8 text-health-blue mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">{t('login', 'title')}</h1>
          </div>
          <CardTitle className="text-xl text-gray-700">{t('login', 'subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('login', 'userId')}</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="test"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('login', 'password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="test123"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-health-blue hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? t('common', 'loading') : t('login', 'loginButton')}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>{language === 'ko' ? '관리자 계정: ID: test / PW: test123' : 'Admin: ID: test / PW: test123'}</p>
            <p>{language === 'ko' ? '회원 계정: ID: kimmy / PW: password123' : 'Member: ID: kimmy / PW: password123'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}