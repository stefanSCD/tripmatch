import { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, MapPin, Building2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const didAutoLoadRef = useRef(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [agencyDescription, setAgencyDescription] = useState(user.agencyDescription || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.avatar || '');

  useEffect(() => {
    setPhone(user.phone || '');
    setCity(user.city || '');
    setCountry(user.country || '');
    setAgencyDescription(user.agencyDescription || '');
    setProfilePictureUrl(user.avatar || '');
  }, [user]);

  useEffect(() => {
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;

    const autoLoad = async () => {
      setInitialLoading(true);
      try {
        await refreshProfile();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load profile.';
        toast.error(message);
      } finally {
        setInitialLoading(false);
      }
    };

    void autoLoad();
  }, [refreshProfile]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      toast.success('Profile loaded from backend.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load profile.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const payload: {
      phone?: string;
      profilePictureUrl?: string;
      city?: string;
      country?: string;
      agencyDescription?: string;
    } = {};

    const nextPhone = phone.trim();
    const nextProfilePictureUrl = profilePictureUrl.trim();
    const nextCity = city.trim();
    const nextCountry = country.trim();
    const nextAgencyDescription = agencyDescription.trim();

    const currentPhone = (user.phone || '').trim();
    const currentProfilePictureUrl = (user.avatar || '').trim();
    const currentCity = (user.city || '').trim();
    const currentCountry = (user.country || '').trim();
    const currentAgencyDescription = (user.agencyDescription || '').trim();

    if (nextPhone !== currentPhone) {
      if (nextPhone.length === 0) {
        toast.error('Phone cannot be empty.');
        return;
      }
      if (nextPhone.length < 5 || nextPhone.length > 30) {
        toast.error('Phone must be between 5 and 30 characters.');
        return;
      }
      payload.phone = nextPhone;
    }

    if (nextProfilePictureUrl !== currentProfilePictureUrl) {
      if (nextProfilePictureUrl.length === 0) {
        toast.error('Profile picture URL cannot be empty.');
        return;
      }
      if (nextProfilePictureUrl.length > 500) {
        toast.error('Profile picture URL can have at most 500 characters.');
        return;
      }
      payload.profilePictureUrl = nextProfilePictureUrl;
    }

    if (nextCity !== currentCity) {
      if (nextCity.length === 0) {
        toast.error('City cannot be empty.');
        return;
      }
      if (nextCity.length > 50) {
        toast.error('City can have at most 50 characters.');
        return;
      }
      payload.city = nextCity;
    }

    if (nextCountry !== currentCountry) {
      if (nextCountry.length === 0) {
        toast.error('Country cannot be empty.');
        return;
      }
      if (nextCountry.length > 50) {
        toast.error('Country can have at most 50 characters.');
        return;
      }
      payload.country = nextCountry;
    }

    if (nextAgencyDescription !== currentAgencyDescription) {
      if (nextAgencyDescription.length === 0) {
        toast.error('Agency description cannot be empty.');
        return;
      }
      if (nextAgencyDescription.length > 1000) {
        toast.error('Agency description can have at most 1000 characters.');
        return;
      }
      payload.agencyDescription = nextAgencyDescription;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No profile changes to save.');
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      await updateProfile(payload);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update profile.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600, color: '#0EA5E9' }}>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>My Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProfile}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50 transition-all"
            style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
          >
            <RefreshCw className={`w-4 h-4 inline mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2.5 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0D9488)', fontSize: '13px', fontWeight: 700 }}
            >
              <Save className="w-4 h-4 inline mr-1.5" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              First Name
            </label>
            <input
              value={user.firstName || ''}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-80"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              Last Name
            </label>
            <input
              value={user.lastName || ''}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-80"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              Email
            </label>
            <input
              value={user.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-80"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              Phone
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              readOnly={!editing}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                editing
                  ? 'border-sky-200 bg-white'
                  : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
              }`}
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              City
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              readOnly={!editing}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                editing
                  ? 'border-sky-200 bg-white'
                  : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
              }`}
              style={{ fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
              Country
            </label>
            <input
              value={country}
              onChange={e => setCountry(e.target.value)}
              readOnly={!editing}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                editing
                  ? 'border-sky-200 bg-white'
                  : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
              }`}
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
            Profile Picture URL
          </label>
          <input
            value={profilePictureUrl}
            onChange={e => setProfilePictureUrl(e.target.value)}
            readOnly={!editing}
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-200 ${
              editing
                ? 'border-sky-200 bg-white'
                : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
            }`}
            style={{ fontSize: '14px' }}
          />
        </div>

        {user.role === 'agency' && (
          <>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1 text-sky-500" />
                Agency Name
              </label>
              <input
                value={user.agencyName || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-80"
                style={{ fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151' }} className="block mb-1.5">
                Agency Description
              </label>
              <textarea
                value={agencyDescription}
                onChange={e => setAgencyDescription(e.target.value)}
                readOnly={!editing}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                  editing
                    ? 'border-sky-200 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-500 cursor-default'
                }`}
                style={{ fontSize: '14px' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
