'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<boolean>
  error: string | null
}

export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    await onSubmit(email, password)
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-border">
        <CardContent className="pt-8 pb-6 px-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/wyn-logo.png"
              alt="WYN"
              width={80}
              height={80}
              className="w-20 h-20"
            />
          </div>

          {/* Title */}
          <h1 className="mina-regular text-2xl text-center mb-2">BENTORNATO</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Accedi per gestire la carta dei vini del tuo ristorante
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ristorante.com"
                  className="w-full h-11 pl-10 pr-4 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-secondary rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-wine"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-wine hover:bg-wine-dark"
              disabled={isLoading}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
              {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </form>

          {/* Demo Note */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo: Usa <span className="text-foreground">admin@osteria.com</span>{' '}
            e <span className="text-foreground">demo</span> per accedere
          </p>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-wine hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>
      </div>
    </div>
  )
}
