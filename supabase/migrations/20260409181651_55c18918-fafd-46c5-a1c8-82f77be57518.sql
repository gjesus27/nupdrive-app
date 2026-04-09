-- Drop the overly permissive update policy
DROP POLICY "Authenticated users can update vehicles" ON public.veiculos;

-- Create more restrictive update policy: only admins or the driver with an active ride can update
CREATE POLICY "Admins can update vehicles" ON public.veiculos FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Drivers can update vehicle status" ON public.veiculos FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.corridas
    WHERE corridas.veiculo_id = veiculos.id
    AND corridas.motorista_id = auth.uid()
    AND corridas.status = 'em_andamento'
  )
);