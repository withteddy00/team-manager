import { useAuth } from '../context/AuthContext';
import { User, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-[#b3b3b3] text-sm mt-1">Configuration de l'application</p>
      </div>

      {/* Profile */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828]">
        <div className="flex items-center gap-3 mb-4">
          <User size={20} className="text-[#1DB954]" />
          <h3 className="text-lg font-semibold">Profil utilisateur</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Nom</label>
            <p className="bg-[#282828] rounded-lg px-4 py-2.5 text-white">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Email</label>
            <p className="bg-[#282828] rounded-lg px-4 py-2.5 text-white">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Rôle</label>
            <p className="bg-[#282828] rounded-lg px-4 py-2.5 text-white">
              {user?.role === 'admin' ? 'Administrateur' : 'Lecteur'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-[#b3b3b3] mb-1">Date de création</label>
            <p className="bg-[#282828] rounded-lg px-4 py-2.5 text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Roles Info */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828]">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-[#1DB954]" />
          <h3 className="text-lg font-semibold">Rôles et Permissions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#282828] rounded-xl p-4 border border-[#383838]">
            <h4 className="font-semibold text-[#1DB954] mb-3">Administrateur</h4>
            <ul className="space-y-2 text-sm text-[#b3b3b3]">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Gestion complète de l'équipe</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Validation des jours fériés</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Validation des astreintes Égypte</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Modification de l'historique</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Export PDF et Excel</li>
            </ul>
          </div>
          <div className="bg-[#282828] rounded-xl p-4 border border-[#383838]">
            <h4 className="font-semibold text-[#b3b3b3] mb-3">Lecteur</h4>
            <ul className="space-y-2 text-sm text-[#b3b3b3]">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b3b3b3]" /> Voir le tableau de bord</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b3b3b3]" /> Voir le calendrier</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b3b3b3]" /> Voir l'historique</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#b3b3b3]" /> Accès en lecture seule</li>
            </ul>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-[#181818] rounded-xl p-6 border border-[#282828]">
        <div className="flex items-center gap-3 mb-4">
          <Info size={20} className="text-[#1DB954]" />
          <h3 className="text-lg font-semibold">Informations de l'application</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between bg-[#282828] rounded-lg px-4 py-3">
            <span className="text-[#b3b3b3]">Version</span><span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between bg-[#282828] rounded-lg px-4 py-3">
            <span className="text-[#b3b3b3]">Montant par déclaration</span><span className="font-medium">1000 DH</span>
          </div>
          <div className="flex justify-between bg-[#282828] rounded-lg px-4 py-3">
            <span className="text-[#b3b3b3]">Pays</span><span className="font-medium">Maroc</span>
          </div>
          <div className="flex justify-between bg-[#282828] rounded-lg px-4 py-3">
            <span className="text-[#b3b3b3]">Bénéficiaires astreinte</span><span className="font-medium">3 personnes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
