from supabase import create_client, Client
from config.settings import settings
from supabase.lib.client_options import ClientOptions

# Cache the clients
_supabase_client: Client | None = None
_supabase_admin: Client | None = None


def get_supabase() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    try:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY

        if not url or not key:
            raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing in .env")

        _supabase_client = create_client(url, key)
        print("✅ Supabase client initialized successfully (using service role key)")
        return _supabase_client

    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        raise


def get_supabase_admin() -> Client:
    """Admin client needed for creating users"""
    global _supabase_admin

    if _supabase_admin is not None:
        return _supabase_admin

    try:
        url = settings.SUPABASE_URL
        service_key = settings.SUPABASE_SERVICE_ROLE_KEY   # Important: different from normal key

        if not url or not service_key:
            raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env")

        _supabase_admin = create_client(
            url, 
            service_key,
            options=ClientOptions(auto_refresh_token=False, persist_session=False)
        )
        print("✅ Supabase Admin client initialized successfully")
        return _supabase_admin

    except Exception as e:
        print(f"❌ Failed to create Supabase Admin client: {e}")
        raise