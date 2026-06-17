-- Create the trigger function for sending telegram notifications
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _chat_id text;
  _tenant_id uuid;
  _bot_token text;
  _subdomain text;
  _custom_domain text;
  _url text;
  _msg_body text;
  _payload jsonb;
BEGIN
  -- Get profile details
  SELECT telegram_chat_id, tenant_id INTO _chat_id, _tenant_id
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Only attempt to notify if the user has a linked Telegram chat ID
  IF _chat_id IS NOT NULL AND _chat_id <> '' AND _tenant_id IS NOT NULL THEN
    -- Get tenant details
    SELECT subdomain, custom_domain, config->'branding'->>'telegram_bot_token' 
    INTO _subdomain, _custom_domain, _bot_token
    FROM public.tenants WHERE id = _tenant_id;

    IF _bot_token IS NOT NULL AND _bot_token <> '' THEN
      -- Construct URL
      IF _custom_domain IS NOT NULL AND _custom_domain <> '' THEN
        _url := 'https://' || _custom_domain;
      ELSIF _subdomain IS NOT NULL AND _subdomain <> '' THEN
        _url := 'https://' || _subdomain || '.unipath.me';
      ELSE
        _url := 'https://unipath.me';
      END IF;

      IF NEW.link IS NOT NULL AND NEW.link <> '' THEN
        _url := _url || NEW.link;
      END IF;

      -- Format message body using markdown
      _msg_body := '🔔 *' || NEW.title || '*' || E'\n\n' || NEW.message;
      IF NEW.link IS NOT NULL AND NEW.link <> '' THEN
        _msg_body := _msg_body || E'\n\n' || '[Batafsil ma''lumot / Подробнее / Open UniPath](' || _url || ')';
      END IF;

      -- Send via pg_net
      _payload := jsonb_build_object(
        'chat_id', _chat_id,
        'text', _msg_body,
        'parse_mode', 'Markdown'
      );

      PERFORM net.http_post(
        url := 'https://api.telegram.org/bot' || _bot_token || '/sendMessage',
        body := _payload
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_inserted ON public.notifications;
CREATE TRIGGER on_notification_inserted
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification();
